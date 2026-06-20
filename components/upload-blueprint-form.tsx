"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  blueprintCategories,
  gameVersions,
  validateBlueprintString,
  type GameVersion,
} from "@/lib/blueprints";
import { createBlueprintAction } from "@/lib/blueprint-actions";

export function UploadBlueprintForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(blueprintCategories[0]);
  const [gameVersion, setGameVersion] = useState<GameVersion>("2.0.0");
  const [tags, setTags] = useState("");
  const [blueprintString, setBlueprintString] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const stringError = useMemo(() => validateBlueprintString(blueprintString), [blueprintString]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setError(null);

    const cleanTitle = title.trim();
    if (cleanTitle.length < 3) {
      setError("Give your blueprint a title of at least 3 characters.");
      return;
    }

    const validationError = validateBlueprintString(blueprintString);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      const result = await createBlueprintAction({
        title: cleanTitle,
        description,
        category,
        gameVersion,
        tags,
        blueprintString,
      });

      if (!result.ok) {
        setError(result.error);
        setSaving(false);
        return;
      }

      router.push(`/blueprints/${result.id}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setSaving(false);
      setError("Could not save this blueprint in Neon. Please try again.");
    }
  }

  return (
    <form className="upload-form" onSubmit={submit}>
      <div className="form-grid-two">
        <label>
          <span>Title</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Compact green circuits" maxLength={90} required />
        </label>
        <label>
          <span>Category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {blueprintCategories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>

      <label>
        <span>Description</span>
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What does this blueprint do?" rows={4} maxLength={700} />
      </label>

      <div className="form-grid-two">
        <label>
          <span>Game version</span>
          <select value={gameVersion} onChange={(event) => setGameVersion(event.target.value as GameVersion)}>
            {gameVersions.map((version) => (
              <option key={version} value={version}>{version}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Tags</span>
          <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="tileable, early game, belts" maxLength={180} />
        </label>
      </div>

      <label>
        <span>Blueprint string</span>
        <textarea
          className="blueprint-string-input"
          value={blueprintString}
          onChange={(event) => setBlueprintString(event.target.value)}
          placeholder="0eNq..."
          rows={8}
          spellCheck={false}
          required
        />
      </label>

      <div className="upload-form-footer">
        <p className={stringError && blueprintString ? "form-warning" : "form-note"}>
          {blueprintString ? stringError ?? `${blueprintString.trim().length.toLocaleString()} characters ready` : "Paste a single Factorio blueprint string. Blueprint books are not supported yet."}
        </p>
        <button type="submit" disabled={saving}>{saving ? "Saving..." : "Add blueprint"}</button>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
    </form>
  );
}
