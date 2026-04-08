"use client";

import { useState } from "react";

interface CommentInputProps {
  authorType: "admin" | "trust_user";
  onSubmit: (data: {
    authorName: string;
    authorEmail?: string;
    message: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
  placeholder?: string;
}

export default function CommentInput({
  authorType,
  onSubmit,
  isSubmitting = false,
  placeholder = "Write a comment...",
}: CommentInputProps) {
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const MAX_MESSAGE_LENGTH = 2000;

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!authorName.trim()) {
      newErrors.authorName = "Name is required";
    }

    if (authorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail)) {
      newErrors.authorEmail = "Invalid email format";
    }

    if (!message.trim()) {
      newErrors.message = "Message is required";
    } else if (message.length > MAX_MESSAGE_LENGTH) {
      newErrors.message = `Maximum ${MAX_MESSAGE_LENGTH} characters allowed`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    await onSubmit({
      authorName: authorName.trim(),
      authorEmail: authorEmail.trim() || undefined,
      message: message.trim(),
    });

    // Clear message after successful submission
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Your name *"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className={`w-full px-3 py-2 text-sm bg-base-100 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
              errors.authorName ? "border-error" : "border-base-300"
            }`}
            disabled={isSubmitting}
          />
          {errors.authorName && (
            <p className="text-xs text-error mt-1">{errors.authorName}</p>
          )}
        </div>
        <div className="flex-1">
          <input
            type="email"
            placeholder="Email (optional)"
            value={authorEmail}
            onChange={(e) => setAuthorEmail(e.target.value)}
            className={`w-full px-3 py-2 text-sm bg-base-100 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
              errors.authorEmail ? "border-error" : "border-base-300"
            }`}
            disabled={isSubmitting}
          />
          {errors.authorEmail && (
            <p className="text-xs text-error mt-1">{errors.authorEmail}</p>
          )}
        </div>
      </div>

      <div>
        <textarea
          placeholder={placeholder}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          className={`w-full px-3 py-2 text-sm bg-base-100 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
            errors.message ? "border-error" : "border-base-300"
          }`}
          disabled={isSubmitting}
        />
        {errors.message && (
          <p className="text-xs text-error mt-1">{errors.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-base-content/40">
          {message.length > 0 && `${message.length}/${MAX_MESSAGE_LENGTH}`}
          {message.length === 0 && "Press Cmd+Enter to send"}
        </span>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !message.trim()}
          className="px-4 py-1.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="loading loading-spinner loading-xs"></span>
              Sending...
            </span>
          ) : (
            "Send"
          )}
        </button>
      </div>
    </div>
  );
}
