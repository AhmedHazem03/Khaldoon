"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/app/profile/actions";

interface Props {
  name: string | null;
  phone_number: string | null;
  default_address: string | null;
  email: string | null;
}

export default function ProfileEditForm({ name, phone_number, default_address, email }: Props) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState({
    name: name ?? "",
    phone_number: phone_number ?? "",
    default_address: default_address ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleChange(field: keyof typeof values) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setSaved(false);
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateProfile(values);
      if ("error" in result) {
        setError(result.error);
      } else {
        setSaved(true);
        setEditing(false);
      }
    });
  }

  function handleCancel() {
    setEditing(false);
    setError(null);
    setValues({
      name: name ?? "",
      phone_number: phone_number ?? "",
      default_address: default_address ?? "",
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
      {/* Email — readonly (from Google) */}
      {email && (
        <InfoRow icon="✉️" label="البريد الإلكتروني" value={email} dir="ltr" />
      )}

      {editing ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">الاسم</label>
            <input
              value={values.name}
              onChange={handleChange("name")}
              placeholder="اسمك"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">رقم الهاتف</label>
            <input
              value={values.phone_number}
              onChange={handleChange("phone_number")}
              placeholder="01XXXXXXXXX"
              dir="ltr"
              type="tel"
              inputMode="numeric"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">العنوان الافتراضي</label>
            <input
              value={values.default_address}
              onChange={handleChange("default_address")}
              placeholder="العنوان للتوصيل"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-accent transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center bg-red-50 rounded-xl py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 min-h-[44px] bg-accent text-white rounded-xl text-sm font-bold disabled:opacity-60 transition-opacity"
            >
              {isPending ? "جاري الحفظ..." : "حفظ"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 min-h-[44px] border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      ) : (
        <>
          <InfoRow icon="👤" label="الاسم" value={values.name || "—"} />
          <InfoRow
            icon="📞"
            label="رقم الهاتف"
            value={values.phone_number || "لم يُضف بعد"}
            dir="ltr"
          />
          <InfoRow
            icon="📍"
            label="العنوان الافتراضي"
            value={values.default_address || "لم يُضف بعد"}
          />

          {saved && (
            <p className="text-green-600 text-sm text-center bg-green-50 rounded-xl py-2">
              ✓ تم الحفظ بنجاح
            </p>
          )}

          <button
            onClick={() => { setSaved(false); setEditing(true); }}
            className="w-full min-h-[44px] rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            تعديل البيانات
          </button>
        </>
      )}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  dir,
}: {
  icon: string;
  label: string;
  value: string;
  dir?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <span className="text-sm">{icon}</span>
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-text" dir={dir}>
          {value}
        </p>
      </div>
    </div>
  );
}
