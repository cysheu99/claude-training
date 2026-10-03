export async function analyzeTicket(ticket) {
  const title = ticket.title.trim();
  const description = ticket.description.trim();
  const text = `${title} ${description}`.toLowerCase();

  let category = "general";
  let suggestedAction = "Review the ticket and contact the requester for more details.";

  if (/login|password|account|sign in/.test(text)) {
    category = "account access";
    suggestedAction = "Verify the account and help the requester restore access.";
  } else if (/payment|billing|invoice|refund|charged/.test(text)) {
    category = "billing";
    suggestedAction = "Review the related billing records and resolve the discrepancy.";
  } else if (/error|bug|crash|broken|failed/.test(text)) {
    category = "technical issue";
    suggestedAction = "Reproduce the issue and investigate the relevant system logs.";
  }

  let urgency = "low";
  if (/urgent|security|outage|data loss|cannot access/.test(text)) {
    urgency = "high";
  } else if (/error|failed|unable|broken/.test(text)) {
    urgency = "medium";
  }

  return {
    summary: `${title}: ${description}`,
    category,
    urgency,
    suggestedAction
  };
}
