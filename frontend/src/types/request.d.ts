type Request = {
	index: number;
	firewall_id: string;
	timestamp: string | Date;
	bug_type: string | null;
	severity: string;
	explanation: string | null;
	type: string;
	fix_proposal?: string | null;
	raw_log?: string; // Raw CSV log line for LLM analysis
	priority?: string; // Priority level (high, medium, low) if detected by model
}

export default Request;
