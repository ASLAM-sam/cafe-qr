import re
import secrets
import string


RESERVED_SUBDOMAINS = {
    "www",
    "api",
    "admin",
    "app",
    "dashboard",
    "platform",
    "mail",
    "smtp",
    "staging",
    "dev",
    "test",
    "static",
    "assets",
}


def generate_id(prefix: str, length: int = 12) -> str:
    """Generate a clean URL-friendly unique identifier with a prefix."""
    random_part = "".join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(length))
    return f"{prefix}_{random_part}"


def generate_qr_token() -> str:
    """Generate an unguessable cryptographically secure token for table QR codes."""
    return secrets.token_urlsafe(16)


def generate_order_reference() -> str:
    """Generate a secure unguessable token for customer order status lookup."""
    return secrets.token_urlsafe(20)


def normalize_subdomain(subdomain: str) -> str:
    """Clean, lowercase, and validate a tenant subdomain."""
    cleaned = subdomain.strip().lower()
    if not re.match(r"^[a-z0-9](?:[a-z0-9\-]{1,30}[a-z0-9])?$", cleaned):
        raise ValueError("Subdomain must be 2-32 characters, contain only letters, numbers, and hyphens.")
    if cleaned in RESERVED_SUBDOMAINS:
        raise ValueError(f"Subdomain '{cleaned}' is reserved by the platform.")
    return cleaned
