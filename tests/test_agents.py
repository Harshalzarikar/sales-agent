"""
Unit tests for individual agent nodes.
All LLM calls are mocked — tests validate logic, routing, and state transitions.
"""
import pytest
from unittest.mock import MagicMock, patch


# ---------------------------------------------------------------------------
# Router Agent
# ---------------------------------------------------------------------------

class TestRouterNode:
    """Tests for the email classification router."""

    def _make_state(self, email_text: str) -> dict:
        return {
            "initial_email": email_text,
            "messages": [],
        }

    def _make_pydantic_result(self, category: str, sender: str = "Test User"):
        """Simulate a structured output Pydantic result from the LLM."""
        from src.agents.router import EmailClassification
        return EmailClassification(
            category=category,
            sender_name=sender,
            reasoning="Test reasoning",
        )

    def test_routes_lead_email(self):
        state = self._make_state("Hi, I'm interested in buying your product.")
        mock_result = self._make_pydantic_result("Lead", "John Doe")

        with patch("src.agents.router.get_llm") as mock_factory:
            mock_llm = MagicMock()
            mock_llm.invoke.return_value = mock_result
            mock_factory.return_value = mock_llm

            from src.agents.router import router_node
            result = router_node(state)

        assert result["category"] == "Lead"
        assert result["sender_name"] == "John Doe"
        assert result["revision_count"] == 0
        assert len(result["messages"]) == 1

    def test_routes_complaint_email(self):
        state = self._make_state("I am very upset about my billing issue.")
        mock_result = self._make_pydantic_result("Complaint", "Jane Smith")

        with patch("src.agents.router.get_llm") as mock_factory:
            mock_llm = MagicMock()
            mock_llm.invoke.return_value = mock_result
            mock_factory.return_value = mock_llm

            from src.agents.router import router_node
            result = router_node(state)

        assert result["category"] == "Complaint"

    def test_routes_spam_email(self):
        state = self._make_state("YOU HAVE WON $1,000,000!!!")
        mock_result = self._make_pydantic_result("Spam", "Unknown")

        with patch("src.agents.router.get_llm") as mock_factory:
            mock_llm = MagicMock()
            mock_llm.invoke.return_value = mock_result
            mock_factory.return_value = mock_llm

            from src.agents.router import router_node
            result = router_node(state)

        assert result["category"] == "Spam"

    def test_fallback_on_exception(self):
        """If LLM completely fails, should default to 'Lead' without crashing."""
        state = self._make_state("Some email content")

        with patch("src.agents.router.get_llm") as mock_factory:
            mock_llm = MagicMock()
            mock_llm.invoke.side_effect = Exception("API timeout")
            mock_factory.return_value = mock_llm

            from src.agents.router import router_node
            result = router_node(state)

        # Should not raise — fallback handles it gracefully
        assert "category" in result
        assert result["revision_count"] == 0


# ---------------------------------------------------------------------------
# Writer Agent
# ---------------------------------------------------------------------------

class TestWriterNode:

    def _make_state(self, revision_count: int = 0, critique: str = ""):
        return {
            "initial_email": "I want to buy your product. I'm from Acme Corp.",
            "company_name": "Acme Corp",
            "company_info": "Acme Corp is a leading supplier of widgets.",
            "revision_count": revision_count,
            "critique": critique,
            "messages": [],
        }

    def test_creates_draft(self):
        state = self._make_state()

        with patch("src.agents.writer.get_llm") as mock_factory:
            mock_llm = MagicMock()
            mock_response = MagicMock()
            mock_response.content = "Dear Acme Corp,\n\nThank you for reaching out..."
            mock_llm.invoke.return_value = mock_response
            mock_factory.return_value = mock_llm

            from src.agents.writer import writer_node
            result = writer_node(state)

        assert "draft_email" in result
        assert result["revision_count"] == 1
        assert "Draft v1" in result["messages"][0]

    def test_increments_revision_count(self):
        state = self._make_state(revision_count=2, critique="REVISE: Make it shorter.")

        with patch("src.agents.writer.get_llm") as mock_factory:
            mock_llm = MagicMock()
            mock_response = MagicMock()
            mock_response.content = "Shorter draft."
            mock_llm.invoke.return_value = mock_response
            mock_factory.return_value = mock_llm

            from src.agents.writer import writer_node
            result = writer_node(state)

        assert result["revision_count"] == 3

    def test_includes_critique_in_prompt(self):
        critique = "REVISE: Add a stronger call-to-action."
        state = self._make_state(critique=critique)

        with patch("src.agents.writer.get_llm") as mock_factory:
            mock_llm = MagicMock()
            mock_response = MagicMock()
            mock_response.content = "Improved draft with CTA."
            mock_llm.invoke.return_value = mock_response
            mock_factory.return_value = mock_llm

            from src.agents.writer import writer_node
            writer_node(state)

        # Verify critique was passed into the prompt
        call_args = mock_llm.invoke.call_args[0][0]
        assert critique in call_args


# ---------------------------------------------------------------------------
# Verifier Agent
# ---------------------------------------------------------------------------

class TestVerifierNode:

    def _make_state(self):
        return {
            "draft_email": "Dear Acme Corp,\n\nThank you for your interest. Let's schedule a call.\n\nBest,\nSales",
            "company_name": "Acme Corp",
            "company_info": "Acme Corp is a widget manufacturer.",
            "messages": [],
        }

    def test_approves_good_draft(self):
        state = self._make_state()

        with patch("src.agents.verifier.get_llm") as mock_factory:
            mock_llm = MagicMock()
            mock_response = MagicMock()
            mock_response.content = "APPROVE"
            mock_llm.invoke.return_value = mock_response
            mock_factory.return_value = mock_llm

            from src.agents.verifier import verifier_node
            result = verifier_node(state)

        assert "APPROVE" in result["critique"].upper()
        assert "APPROVED" in result["messages"][0]

    def test_requests_revision_on_bad_draft(self):
        state = self._make_state()

        with patch("src.agents.verifier.get_llm") as mock_factory:
            mock_llm = MagicMock()
            mock_response = MagicMock()
            mock_response.content = "REVISE: Add a stronger call-to-action and mention the product."
            mock_llm.invoke.return_value = mock_response
            mock_factory.return_value = mock_llm

            from src.agents.verifier import verifier_node
            result = verifier_node(state)

        assert "REVISE" in result["critique"]
        assert "REVISE" in result["messages"][0]


# ---------------------------------------------------------------------------
# Researcher Agent
# ---------------------------------------------------------------------------

class TestResearcherNode:

    def _make_state(self):
        return {
            "initial_email": "Hi, I'm the CEO of Acme Corp and want to learn about your services.",
            "messages": [],
        }

    def test_skips_research_when_no_tavily_key(self):
        state = self._make_state()

        with patch("src.agents.researcher.get_search_tool", return_value=None):
            from src.agents.researcher import researcher_node
            result = researcher_node(state)

        assert result["company_name"] == "Unknown"
        assert "skipped" in result["messages"][0].lower()

    def test_extracts_company_and_researches(self):
        state = self._make_state()

        mock_search = MagicMock()
        mock_search.invoke.return_value = [
            {"content": "Acme Corp is a leading widget manufacturer in Austin, TX."}
        ]

        with patch("src.agents.researcher.get_search_tool", return_value=mock_search):
            with patch("src.agents.researcher.get_llm") as mock_factory:
                mock_llm = MagicMock()
                mock_response = MagicMock()
                mock_response.content = "Acme Corp"
                mock_llm.invoke.return_value = mock_response
                mock_factory.return_value = mock_llm

                from src.agents.researcher import researcher_node
                result = researcher_node(state)

        assert result["company_name"] == "Acme Corp"
        assert "Acme Corp" in result["company_info"]
