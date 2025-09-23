// Client-side utilities for calling server-side Firebase APIs

export interface FirestoreQuery {
  collection: string;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
  limit?: number;
  whereField?: string;
  whereOp?:
    | "=="
    | "!="
    | "<"
    | "<="
    | ">"
    | ">="
    | "array-contains"
    | "array-contains-any"
    | "in"
    | "not-in";
  whereValue?: string | number | boolean;
}

export interface FirestoreDocument {
  id: string;
  [key: string]: any;
}

export interface FirestoreWriteData {
  collection: string;
  id?: string;
  data: Record<string, any>;
  merge?: boolean;
}

export interface StorageUploadData {
  file: File;
  path: string;
  metadata?: Record<string, any>;
}

// Firestore APIs
export async function getCollection(
  query: FirestoreQuery
): Promise<{ documents: FirestoreDocument[] }> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });

  const response = await fetch(`/api/firestore/collections?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch collection: ${response.statusText}`);
  }
  return response.json();
}

export async function getDocument(
  collection: string,
  id: string
): Promise<{ document: FirestoreDocument }> {
  const params = new URLSearchParams({ collection, id });
  const response = await fetch(`/api/firestore/document?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch document: ${response.statusText}`);
  }
  return response.json();
}

export async function writeDocument(
  data: FirestoreWriteData
): Promise<{ success: boolean; id: string; message: string }> {
  const response = await fetch("/api/firestore/write", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Failed to write document: ${response.statusText}`);
  }
  return response.json();
}

// Storage APIs
export async function uploadFile(data: StorageUploadData): Promise<{
  success: boolean;
  url: string;
  path: string;
  size: number;
  contentType: string;
}> {
  const formData = new FormData();
  formData.append("file", data.file);
  formData.append("path", data.path);
  if (data.metadata) {
    formData.append("metadata", JSON.stringify(data.metadata));
  }

  const response = await fetch("/api/storage/upload", {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    throw new Error(`Failed to upload file: ${response.statusText}`);
  }
  return response.json();
}

export async function getFileUrl(
  path: string,
  expiresIn: number = 3600
): Promise<{ url: string; path: string; metadata: any }> {
  const params = new URLSearchParams({ path, expiresIn: String(expiresIn) });
  const response = await fetch(`/api/storage/url?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to get file URL: ${response.statusText}`);
  }
  return response.json();
}

// Helper function to create a document
export async function createDocument(
  collection: string,
  data: Record<string, any>
): Promise<{ success: boolean; id: string; message: string }> {
  return writeDocument({ collection, data });
}

// Helper function to update a document
export async function updateDocument(
  collection: string,
  id: string,
  data: Record<string, any>
): Promise<{ success: boolean; id: string; message: string }> {
  return writeDocument({ collection, id, data });
}

// Helper function to get all documents from a collection
export async function getAllDocuments(
  collection: string
): Promise<{ documents: FirestoreDocument[] }> {
  return getCollection({ collection });
}

// Helper function to get documents with pagination
export async function getDocumentsWithLimit(
  collection: string,
  limit: number
): Promise<{ documents: FirestoreDocument[] }> {
  return getCollection({ collection, limit });
}

// Helper function to get documents with ordering
export async function getOrderedDocuments(
  collection: string,
  orderBy: string,
  orderDirection: "asc" | "desc" = "asc"
): Promise<{ documents: FirestoreDocument[] }> {
  return getCollection({ collection, orderBy, orderDirection });
}

// Helper function to get filtered documents
export async function getFilteredDocuments(
  collection: string,
  whereField: string,
  whereOp: FirestoreQuery["whereOp"],
  whereValue: string | number | boolean
): Promise<{ documents: FirestoreDocument[] }> {
  return getCollection({ collection, whereField, whereOp, whereValue });
}
