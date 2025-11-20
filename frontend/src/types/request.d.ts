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
	src_ip?: string; // Source IP address
	src_port?: string | number; // Source port
	dst_ip?: string; // Destination IP address
	dst_port?: string | number; // Destination port
}

export default Request;
