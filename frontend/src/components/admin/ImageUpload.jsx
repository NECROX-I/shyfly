import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { FiUploadCloud, FiX, FiImage } from "react-icons/fi";
import { adminAPI } from "../../services/api";
import { errMsg, img } from "../../lib/format";

// value = { image, imagePublicId }; onChange gets the same shape. Square-cropped upload to Cloudinary.
export default function ImageUpload({
  value,
  onChange,
  round = true,
  size = "h-24 w-24",
}) {
  const file = useRef();
  const [busy, setBusy] = useState(false);
  const pick = async (files) => {
    const x = files?.[0];
    if (!x) return;
    if (!x.type.startsWith("image/"))
      return toast.error("Please choose an image file");
    if (x.size > 6 * 1024 * 1024)
      return toast.error("Image too large (max 6 MB)");
    setBusy(true);
    try {
      const r = await adminAPI.uploadCategoryImage(x);
      onChange({
        image: r.data.image.url,
        imagePublicId: r.data.image.publicId,
      });
      toast.success("Uploaded — press Save to apply");
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };
  const has = !!value?.image;
  return (
    <div className="flex flex-wrap items-center gap-4">
      <span
        className={`grid shrink-0 place-items-center overflow-hidden bg-plum-50 text-plum-300 ${round ? "rounded-full" : "rounded-2xl"} ${size}`}
      >
        {has ? (
          <img
            src={img(value.image, 240)}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <FiImage size={22} />
        )}
      </span>
      <div className="space-y-2">
        <input
          ref={file}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            pick(e.target.files);
            e.target.value = "";
          }}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => file.current.click()}
            className="btn-outline !px-4 !py-2.5"
          >
            <FiUploadCloud />{" "}
            {busy ? "Uploading…" : has ? "Replace picture" : "Upload picture"}
          </button>
          {has && (
            <button
              type="button"
              onClick={() => onChange({ image: "", imagePublicId: "" })}
              className="btn !px-4 !py-2.5 text-rose-500 hover:bg-rose-50"
            >
              <FiX /> Remove
            </button>
          )}
        </div>
        <p className="text-xs text-plum-700/60">
          Auto-cropped square · JPG / PNG / WebP · max 6 MB
        </p>
      </div>
    </div>
  );
}
