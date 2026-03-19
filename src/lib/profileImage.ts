export function normalizeProfileImage(value: string | null | undefined) {
  const image = value?.trim() || null;

  return {
    image,
    imageUploadedAt: image ? new Date() : null,
  };
}
