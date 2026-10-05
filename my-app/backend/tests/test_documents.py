def test_document_rejects_non_pdf(client):
    response = client.post(
        "/documents/upload",
        files={"file": ("notes.txt", b"not a pdf", "text/plain")},
        data={"document_type": "lecture_notes"},
    )
    assert response.status_code == 415


def test_document_requires_file(client):
    response = client.post("/documents/upload", data={"document_type": "other"})
    assert response.status_code == 422
