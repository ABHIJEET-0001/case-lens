"""
app/services/query_expansion.py
───────────────────────────────
Statutory mapping between old penal/procedural codes (IPC, CrPC)
and the Bharatiya Nyaya Sanhita (BNS) / Bharatiya Nagarik Suraksha Sanhita (BNSS).
"""
import re
from typing import Dict, List, Tuple

# Key high-frequency IPC -> BNS mappings
IPC_TO_BNS: Dict[str, Tuple[str, str]] = {
    "302": ("103", "Murder"),
    "304": ("105", "Culpable homicide not amounting to murder"),
    "304b": ("80", "Dowry death"),
    "307": ("109", "Attempt to murder"),
    "375": ("63", "Rape"),
    "376": ("64", "Punishment for rape"),
    "420": ("318", "Cheating and dishonestly inducing delivery of property"),
    "406": ("316", "Criminal breach of trust"),
    "498a": ("85", "Cruelty by husband or relatives"),
    "120b": ("61", "Criminal conspiracy"),
    "124a": ("152", "Acts endangering sovereignty, unity and integrity of India"),
    "323": ("115", "Voluntarily causing hurt"),
    "34": ("3(5)", "Joint liability / common intention"),
}

# Key high-frequency CrPC -> BNSS mappings
CRPC_TO_BNSS: Dict[str, Tuple[str, str]] = {
    "437": ("480", "Bail in non-bailable offences"),
    "438": ("482", "Direction for grant of anticipatory bail"),
    "439": ("483", "Special powers of High Court or Court of Session regarding bail"),
    "482": ("528", "Saving of inherent powers of High Court"),
    "41a": ("35", "Notice of appearance before police officer"),
    "164": ("183", "Recording of confessions and statements"),
    "167": ("187", "Procedure when investigation cannot be completed in 24 hours / default bail"),
    "173": ("193", "Report of police officer on completion of investigation"),
    "313": ("351", "Power to examine the accused"),
}


def expand_statutory_query(query: str) -> Tuple[str, List[str]]:
    """
    Detects mentions of IPC/CrPC or BNS/BNSS sections and expands the query
    with modern or historical counterpart sections.
    Returns: (expanded_query, list_of_applied_expansions)
    """
    expanded_parts = [query]
    applied_expansions: List[str] = []

    # Match "Section <num> IPC" or "Sec. <num> IPC" or "s. <num> ipc"
    ipc_matches = re.finditer(r"(?:sec(?:tion|\.)?\s*)(\d+[a-z]?)\s*(?:of\s+the\s+)?(?:ipc|indian penal code)", query, re.IGNORECASE)
    for match in ipc_matches:
        sec = match.group(1).lower()
        if sec in IPC_TO_BNS:
            bns_sec, desc = IPC_TO_BNS[sec]
            note = f"Section {bns_sec} BNS ({desc})"
            expanded_parts.append(f"Section {bns_sec} BNS")
            applied_expansions.append(f"IPC {sec.upper()} → BNS {bns_sec}")

    # Match "Section <num> CrPC"
    crpc_matches = re.finditer(r"(?:sec(?:tion|\.)?\s*)(\d+[a-z]?)\s*(?:of\s+the\s+)?(?:crpc|code of criminal procedure)", query, re.IGNORECASE)
    for match in crpc_matches:
        sec = match.group(1).lower()
        if sec in CRPC_TO_BNSS:
            bnss_sec, desc = CRPC_TO_BNSS[sec]
            expanded_parts.append(f"Section {bnss_sec} BNSS")
            applied_expansions.append(f"CrPC {sec.upper()} → BNSS {bnss_sec}")

    # Reverse matching: BNS -> IPC
    bns_matches = re.finditer(r"(?:sec(?:tion|\.)?\s*)(\d+[a-z]?)\s*(?:of\s+the\s+)?(?:bns|bharatiya nyaya sanhita)", query, re.IGNORECASE)
    for match in bns_matches:
        sec = match.group(1).lower()
        for old_sec, (new_sec, desc) in IPC_TO_BNS.items():
            if sec == new_sec.lower():
                expanded_parts.append(f"Section {old_sec.upper()} IPC")
                applied_expansions.append(f"BNS {sec} → IPC {old_sec.upper()}")

    # Reverse matching: BNSS -> CrPC
    bnss_matches = re.finditer(r"(?:sec(?:tion|\.)?\s*)(\d+[a-z]?)\s*(?:of\s+the\s+)?(?:bnss|bharatiya nagarik suraksha sanhita)", query, re.IGNORECASE)
    for match in bnss_matches:
        sec = match.group(1).lower()
        for old_sec, (new_sec, desc) in CRPC_TO_BNSS.items():
            if sec == new_sec.lower():
                expanded_parts.append(f"Section {old_sec.upper()} CrPC")
                applied_expansions.append(f"BNSS {sec} → CrPC {old_sec.upper()}")

    return " ".join(expanded_parts), applied_expansions
