"""
ArgusASM Mock AWS S3 Cloud Service
Simulates an unallocated / deleted AWS S3 bucket returning HTTP 404 NoSuchBucket.
Used for TEST-SEED-03 (test-s3.aiori.lab -> aiori-dormant-bucket.s3.amazonaws.com).
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import sys

S3_NO_SUCH_BUCKET_XML = """<?xml version="1.0" encoding="UTF-8"?>
<Error>
  <Code>NoSuchBucket</Code>
  <Message>The specified bucket does not exist</Message>
  <BucketName>aiori-dormant-bucket</BucketName>
  <RequestId>4433221100AABBCC</RequestId>
  <HostId>MockS3HostIdForArgusTestbed==</HostId>
</Error>
"""

class MockS3Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(404)
        self.send_header("Content-Type", "application/xml")
        self.send_header("Server", "AmazonS3")
        self.send_header("x-amz-request-id", "4433221100AABBCC")
        self.end_headers()
        self.wfile.write(S3_NO_SUCH_BUCKET_XML.encode("utf-8"))

    def do_HEAD(self):
        self.send_response(404)
        self.send_header("Content-Type", "application/xml")
        self.send_header("Server", "AmazonS3")
        self.end_headers()

    def log_message(self, format, *args):
        pass

def run(port=9000):
    server = HTTPServer(("0.0.0.0", port), MockS3Handler)
    print(f"[+] Mock S3 service listening on port {port} (NoSuchBucket 404)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 9000
    run(port)
