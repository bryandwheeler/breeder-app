// SignNow E-Signature Client Wrapper
// Provides typed wrappers for Firebase Cloud Functions

import { httpsCallable } from 'firebase/functions';
import { functions } from '@breeder/firebase';
import {
  ContractSigner,
  UploadContractResponse,
  CreateInviteResponse,
  EmbeddedSigningLinkResponse,
} from '@breeder/types';

/**
 * Upload a contract PDF to SignNow
 */
export const uploadContractToSignNow = httpsCallable<
  {
    contractId: string;
    pdfBase64: string;
    fileName?: string;
  },
  UploadContractResponse
>(functions, 'uploadContractToSignNow');

/**
 * Create signing invites for contract signers
 */
export const createSigningInvite = httpsCallable<
  {
    contractId: string;
    signers: Array<{
      id: string;
      email: string;
      name: string;
      role: string;
      order?: number;
    }>;
    message?: string;
    subject?: string;
  },
  CreateInviteResponse
>(functions, 'createSigningInvite');

/**
 * Get an embedded signing link for a signer
 */
export const getEmbeddedSigningLink = httpsCallable<
  {
    contractId: string;
    signerId: string;
    redirectUrl?: string;
  },
  EmbeddedSigningLinkResponse
>(functions, 'getEmbeddedSigningLink');

/**
 * Helper to convert a File to base64
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Upload a contract PDF file to SignNow
 * Convenience wrapper that handles file-to-base64 conversion
 */
export async function uploadContractFile(
  contractId: string,
  file: File
): Promise<UploadContractResponse> {
  const pdfBase64 = await fileToBase64(file);
  const result = await uploadContractToSignNow({
    contractId,
    pdfBase64,
    fileName: file.name,
  });
  return result.data;
}

/**
 * Send a contract for signing
 */
export async function sendContractForSigning(
  contractId: string,
  signers: ContractSigner[],
  options?: {
    message?: string;
    subject?: string;
  }
): Promise<CreateInviteResponse> {
  const result = await createSigningInvite({
    contractId,
    signers: signers.map((s) => ({
      id: s.id,
      email: s.email,
      name: s.name,
      role: s.role,
      order: s.order,
    })),
    message: options?.message,
    subject: options?.subject,
  });
  return result.data;
}

/**
 * Get an embedded signing URL for in-app signing
 */
export async function getSigningUrl(
  contractId: string,
  signerId: string,
  redirectUrl?: string
): Promise<{ url: string; expiresAt: string } | null> {
  const result = await getEmbeddedSigningLink({
    contractId,
    signerId,
    redirectUrl,
  });

  if (result.data.success && result.data.signingUrl) {
    return {
      url: result.data.signingUrl,
      expiresAt: result.data.expiresAt || '',
    };
  }

  return null;
}
