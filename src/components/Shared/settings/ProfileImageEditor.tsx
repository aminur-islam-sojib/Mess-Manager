"use client";

import { useMemo, useRef, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { Crop, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { uploadImageToImgBB } from "@/actions/server/ImageUpload";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fileToDataUrl, getCroppedImageDataUrl } from "@/lib/imageClient";

export default function ProfileImageEditor({
  idPrefix,
  image,
  fallbackInitial,
  disabled,
  onImageChange,
  onUploadingChange,
}: {
  idPrefix: string;
  image: string;
  fallbackInitial: string;
  disabled: boolean;
  onImageChange: (value: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sourceDataUrl, setSourceDataUrl] = useState("");
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [localPreview, setLocalPreview] = useState("");

  const previewSrc = useMemo(
    () => localPreview || image,
    [image, localPreview],
  );

  const setUploading = (uploading: boolean) => {
    setIsUploading(uploading);
    onUploadingChange?.(uploading);
  };

  const onFileSelected = async (file?: File) => {
    if (!file) return;

    try {
      const dataUrl = await fileToDataUrl(file);
      setSourceDataUrl(dataUrl);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setDialogOpen(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to prepare image",
      );
    }
  };

  const onApplyCrop = async () => {
    if (!sourceDataUrl || !croppedAreaPixels) {
      toast.error("Please adjust crop area first");
      return;
    }

    setUploading(true);
    try {
      const croppedDataUrl = await getCroppedImageDataUrl(
        sourceDataUrl,
        croppedAreaPixels,
      );

      setLocalPreview(croppedDataUrl);

      const result = await uploadImageToImgBB({
        dataUrl: croppedDataUrl,
        kind: "avatar",
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      onImageChange(result.url);
      setDialogOpen(false);
      setSourceDataUrl("");
      setLocalPreview("");
      toast.success("Image updated and ready to save profile");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Image upload failed",
      );
    } finally {
      setUploading(false);
    }
  };

  const onRemove = () => {
    onImageChange("");
    setLocalPreview("");
    toast.success("Profile image removed. Save profile to apply.");
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={`${idPrefix}-image-url`}>Profile Image (ImgBB)</Label>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-muted/20 p-4 md:flex-row md:items-center">
        <Avatar size="lg">
          <AvatarImage src={previewSrc} />
          <AvatarFallback>{fallbackInitial}</AvatarFallback>
        </Avatar>

        <div className="w-full space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={disabled || isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Replace Image
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="gap-2"
              disabled={disabled || isUploading || !image}
              onClick={onRemove}
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          </div>

          <Input
            ref={fileInputRef}
            id={`${idPrefix}-image-upload`}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp"
            disabled={disabled || isUploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              void onFileSelected(file);
              event.currentTarget.value = "";
            }}
          />

          <p className="text-xs text-muted-foreground">
            Replace, crop, and zoom before upload. Allowed: jpg/png/webp, max
            3MB.
          </p>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crop className="h-5 w-5" />
              Crop and Zoom
            </DialogTitle>
            <DialogDescription>
              Fine-tune your image before uploading it as your profile picture.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative h-80 w-full overflow-hidden rounded-2xl bg-black">
              {sourceDataUrl ? (
                <Cropper
                  image={sourceDataUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, croppedPixels) =>
                    setCroppedAreaPixels(croppedPixels)
                  }
                />
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-zoom`}>Zoom</Label>
              <Input
                id={`${idPrefix}-zoom`}
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isUploading}
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="gap-2"
              disabled={isUploading}
              onClick={() => void onApplyCrop()}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Crop className="h-4 w-4" />
              )}
              Upload Cropped Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
