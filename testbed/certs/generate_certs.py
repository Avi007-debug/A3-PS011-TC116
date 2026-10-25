"""
ArgusASM Testbed Certificate Generator
Generates reproducible test X.509 PKI certificates for:
- Host A (Control): Valid certificate for api.aiori.lab / aiori.lab
- Host B (Seed 1): Expired certificate for legacy.aiori.lab (expired 2026-01-01)
- Staging (FP Control): Self-signed certificate for staging.aiori.lab
"""

import os
from datetime import datetime, timezone, timedelta
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

def generate_key_and_cert(
    cn: str,
    sans: list[str],
    not_valid_before: datetime,
    not_valid_after: datetime,
    cert_filename: str,
    key_filename: str,
    is_ca: bool = False
):
    key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )

    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, "US"),
        x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "California"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, "AIORI Infrastructure Org"),
        x509.NameAttribute(NameOID.COMMON_NAME, cn),
    ])

    san_list = [x509.DNSName(san) for san in sans]

    builder = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(not_valid_before)
        .not_valid_after(not_valid_after)
        .add_extension(x509.SubjectAlternativeName(san_list), critical=False)
        .add_extension(
            x509.BasicConstraints(ca=is_ca, path_length=None),
            critical=True,
        )
    )

    cert = builder.sign(key, hashes.SHA256())

    cert_path = os.path.join(OUTPUT_DIR, cert_filename)
    key_path = os.path.join(OUTPUT_DIR, key_filename)

    with open(cert_path, "wb") as f:
        f.write(cert.public_bytes(serialization.Encoding.PEM))

    with open(key_path, "wb") as f:
        f.write(
            key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.TraditionalOpenSSL,
                encryption_algorithm=serialization.NoEncryption(),
            )
        )

    print(f"[+] Generated {cert_filename} ({cn}, valid: {not_valid_before.date()} -> {not_valid_after.date()})")

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    now = datetime.now(timezone.utc)

    # 1. Healthy certificate (Host A control: valid until 2027)
    generate_key_and_cert(
        cn="api.aiori.lab",
        sans=["api.aiori.lab", "aiori.lab"],
        not_valid_before=now - timedelta(days=60),
        not_valid_after=now + timedelta(days=300),
        cert_filename="healthy.crt",
        key_filename="healthy.key"
    )

    # 2. Expired certificate (Host B seed 1: expired 2026-01-01)
    generate_key_and_cert(
        cn="legacy.aiori.lab",
        sans=["legacy.aiori.lab"],
        not_valid_before=datetime(2025, 1, 1, 0, 0, 0, tzinfo=timezone.utc),
        not_valid_after=datetime(2026, 1, 1, 0, 0, 0, tzinfo=timezone.utc),
        cert_filename="expired.crt",
        key_filename="expired.key"
    )

    # 3. Staging self-signed certificate (FP control)
    generate_key_and_cert(
        cn="staging.aiori.lab",
        sans=["staging.aiori.lab"],
        not_valid_before=now - timedelta(days=30),
        not_valid_after=now + timedelta(days=180),
        cert_filename="staging.crt",
        key_filename="staging.key"
    )

if __name__ == "__main__":
    main()
