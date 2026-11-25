import { useState } from "react";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import type { ScreensaverMeta, Screensaver } from "../types";
import { useLinks } from "@/config/links";

type Props = {
  open: boolean;
  onClose: () => void;
  previewUrl: string | null;
  isPublishing: boolean;
  error: string | null;
  onPublish: (meta: ScreensaverMeta) => Promise<Screensaver | null>;
  onDownload: () => void;
};

const MAX_NAME = 60;
const MAX_AUTHOR = 30;
const MAX_DESC = 200;
const MAX_TAGS = 12;
const MAX_TAG_LEN = 20;

const NAME_SUGGESTIONS: string[] = [];

const TAG_SUGGESTIONS = [
  "escuro",
  "minimalista",
  "retrô",
  "natureza",
  "anime",
  "cyberpunk",
  "vintage",
];

const TAG_SEPARATORS = /[,;:]+/;
const HAS_SEPARATOR = /[,;:]/;

export function PublishModal({
  open,
  onClose,
  previewUrl,
  isPublishing,
  error,
  onPublish,
  onDownload,
}: Props) {
  const [name, setName] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagWarning, setTagWarning] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const [created, setCreated] = useState<Screensaver | null>(null);
  const [copied, setCopied] = useState(false);

  const canPublish =
    name.trim().length > 0 && !isPublishing && previewUrl !== null;

  const addTag = (raw: string) => {
    const t = raw.trim().toLowerCase().slice(0, MAX_TAG_LEN);
    if (!t) return;
    if (tags.length >= MAX_TAGS) {
      setTagWarning(`Máximo de ${MAX_TAGS} tags atingido.`);
      return;
    }
    if (tags.includes(t)) {
      setTagWarning(`#${t} já foi adicionada.`);
      return;
    }
    setTags((prev) => [...prev, t]);
    setTagInput("");
    setTagWarning(null);
  };

  const removeTag = (t: string) =>
    setTags((prev) => prev.filter((x) => x !== t));

  const handleTagChange = (raw: string) => {
    if (HAS_SEPARATOR.test(raw)) {
      const parts = raw.split(TAG_SEPARATORS);
      const endsWithSep = TAG_SEPARATORS.test(raw.slice(-1));
      const toAdd = endsWithSep ? parts : parts.slice(0, -1);
      const remainder = endsWithSep ? "" : parts[parts.length - 1];

      toAdd.filter(Boolean).forEach((p) => addTag(p));
      setTagInput(remainder.slice(0, MAX_TAG_LEN));
      return;
    }
    setTagInput(raw.slice(0, MAX_TAG_LEN));
  };

  const handleTagPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (HAS_SEPARATOR.test(text)) {
      e.preventDefault();
      const parts = text.split(TAG_SEPARATORS).filter(Boolean);
      parts.forEach((p) => addTag(p));
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const handlePublish = async () => {
    if (!canPublish) return;
    const result = await onPublish({
      name: name.trim(),
      author: author.trim(),
      description: description.trim(),
      tags,
    });
    if (result?.id) {
      setCreated(result);
      setPublished(true);
    }
  };

  const nav = useLinks();

  const buildShareUrl = (id: string) => {
    const path = nav.xteink_screensaver_screensaver_post.replace(/\/+$/, "");
    return path.startsWith("/") ? `${window.location.origin}${path}/${id}` : `${path}/${id}`;
  };

  const handleGoToPost = () => {
    if (!created?.id) return;
    window.location.href = buildShareUrl(created.id);
  };

  const handleCopyUrl = async () => {
    if (!created?.id) return;
    try {
      await navigator.clipboard.writeText(buildShareUrl(created.id));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
    }
  };

  const reset = () => {
    setName("");
    setAuthor("");
    setDescription("");
    setTags([]);
    setTagInput("");
    setTagWarning(null);
    setPublished(false);
    setCreated(null);
    setCopied(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isPublishing) return;
    if (!isOpen) {
      reset();
      onClose();
    }
  };

  const availableTagSuggestions = TAG_SUGGESTIONS.filter(
    (t) => !tags.includes(t)
  ).slice(0, 6);

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} showSwipeHandle>
      <DrawerContent>
        <div className="mx-auto w-full max-w-lg overflow-y-auto px-6 pb-4">
          {published && created?.id ? (
            <div className="flex flex-col items-center text-center py-6">
              <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                <Check className="w-7 h-7 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Publicado!</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Seu screensaver já está na galeria da comunidade.
              </p>

              {created.preview_url && (
                <img
                  src={created.preview_url}
                  alt={created.name}
                  className="rounded-lg border border-border mb-5"
                  style={{ maxHeight: 180 }}
                />
              )}

              <div className="w-full mb-4 text-left">
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  Link do post
                </Label>
                <div className="flex gap-2">
                  <Input
                      readOnly
                      value={buildShareUrl(created.id)}
                      className="flex-1 text-xs"
                      onFocus={(e) => e.currentTarget.select()}
                    />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyUrl}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    {copied ? "Copiado!" : "Copiar"}
                  </Button>
                </div>
              </div>

              <div className="w-full space-y-2">
                <Button className="w-full" onClick={handleGoToPost}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver publicação
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={onDownload}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar BMP agora
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => handleOpenChange(false)}
                >
                  Fechar
                </Button>
              </div>
            </div>
          ) : (
            <>
              <DrawerHeader className="px-0">
                <DrawerTitle>Publicar na galeria</DrawerTitle>
                <DrawerDescription>
                  Compartilhe seu screensaver com a comunidade
                </DrawerDescription>
              </DrawerHeader>

              {previewUrl && (
                <div className="flex justify-center my-4">
                  <img
                    src={previewUrl}
                    alt="Screensaver"
                    className="rounded-lg border border-border"
                    style={{ maxHeight: 180 }}
                  />
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="screensaver-name"
                    className="text-sm mb-1.5 block"
                  >
                    Nome <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="screensaver-name"
                    type="text"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value.slice(0, MAX_NAME))
                    }
                    placeholder="Ex: Meu setup natalino"
                    maxLength={MAX_NAME}
                  />

                  {NAME_SUGGESTIONS.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {NAME_SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setName(s.slice(0, MAX_NAME))}
                          className="text-[11px] px-2 py-0.5 rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}

                  <p className="text-[10px] text-muted-foreground text-right mt-0.5">
                    {name.length}/{MAX_NAME}
                  </p>
                </div>

                <div>
                  <Label
                    htmlFor="screensaver-author"
                    className="text-sm mb-1.5 block"
                  >
                    Autor{" "}
                    <span className="text-muted-foreground">(opcional)</span>
                  </Label>
                  <Input
                    id="screensaver-author"
                    type="text"
                    value={author}
                    onChange={(e) =>
                      setAuthor(e.target.value.slice(0, MAX_AUTHOR))
                    }
                    placeholder="Ex: @joao"
                    maxLength={MAX_AUTHOR}
                  />
                  <p className="text-[10px] text-muted-foreground text-right mt-0.5">
                    {author.length}/{MAX_AUTHOR}
                  </p>
                </div>

                <div>
                  <Label
                    htmlFor="screensaver-desc"
                    className="text-sm mb-1.5 block"
                  >
                    Descrição{" "}
                    <span className="text-muted-foreground">(opcional)</span>
                  </Label>
                  <Textarea
                    id="screensaver-desc"
                    value={description}
                    onChange={(e) =>
                      setDescription(e.target.value.slice(0, MAX_DESC))
                    }
                    placeholder="Uma frase sobre seu screensaver…"
                    maxLength={MAX_DESC}
                    rows={3}
                    className="resize-none"
                  />
                  <p className="text-[10px] text-muted-foreground text-right mt-0.5">
                    {description.length}/{MAX_DESC}
                  </p>
                </div>

                <div>
                  <Label className="text-sm mb-1.5 block">
                    Tags{" "}
                    <span className="text-muted-foreground">
                      (opcional, máx {MAX_TAGS})
                    </span>
                  </Label>

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {tags.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-secondary text-secondary-foreground"
                        >
                          #{t}
                          <button
                            type="button"
                            onClick={() => removeTag(t)}
                            className="hover:text-destructive"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={tagInput}
                      onChange={(e) => handleTagChange(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      onPaste={handleTagPaste}
                      placeholder="ex: dark, minimalista…"
                      maxLength={MAX_TAG_LEN}
                      disabled={tags.length >= MAX_TAGS}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addTag(tagInput)}
                      disabled={tags.length >= MAX_TAGS || !tagInput.trim()}
                    >
                      Adicionar
                    </Button>
                  </div>

                  {tagWarning && (
                    <p className="text-[11px] text-destructive mt-1">
                      {tagWarning}
                    </p>
                  )}

                  {tags.length < MAX_TAGS &&
                    availableTagSuggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {availableTagSuggestions.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => addTag(t)}
                            className="text-[11px] px-2 py-0.5 rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                          >
                            + #{t}
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive mt-4 text-center">
                  {error}
                </p>
              )}

              <DrawerFooter className="px-0 mt-6">
                <Button
                  className="w-full"
                  onClick={handlePublish}
                  disabled={!canPublish}
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Publicando…
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Publicar na galeria
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={onDownload}
                  disabled={!previewUrl}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar BMP sem publicar
                </Button>
              </DrawerFooter>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}