type Request = {
	index: number;
	firewall_id: string;
	timestamp: Date;
	bug_type: string | null;
	severity: string;
	explanation: string | null;
	type: string;
	fix_proposal?: string | null;
}

export default Request;
