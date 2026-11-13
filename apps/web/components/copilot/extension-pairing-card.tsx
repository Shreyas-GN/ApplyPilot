"use client";

import { useState, type FormEvent } from "react";
import type { ExtensionSessionDto } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { api, ApiError } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";

export function ExtensionPairingCard({
  onSessionChanged,
  title = "Chrome Extension Co-Pilot",
  description = "Pair your browser extension to capture jobs and review-before-autofill on supported ATS applications.",
}: {
  onSessionChanged?: () => void;
  title?: string;
  description?: string;
}) {
  const {
    data: sessions,
    loading: sessionsLoading,
    refetch: refetchSessions,
  } = useApi<ExtensionSessionDto[]>("/extension/sessions");
  const [deviceLabel, setDeviceLabel] = useState("My Chrome Browser");
  const [pairingToken, setPairingToken] = useState<string | null>(null);
  const [pairingBusy, setPairingBusy] = useState(false);
  const [extensionError, setExtensionError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  async function handleGeneratePairingToken(e: FormEvent) {
    e.preventDefault();
    setPairingBusy(true);
    setExtensionError(null);
    setCopiedToken(false);
    try {
      const res = await api.post<{ session: ExtensionSessionDto; token: string }>(
        "/extension/sessions",
        { label: deviceLabel.trim() || "Chrome Extension" }
      );
      setPairingToken(res.token);
      refetchSessions();
      onSessionChanged?.();
    } catch (err) {
      setExtensionError(
        err instanceof ApiError ? err.detail : "Failed to generate pairing token."
      );
    } finally {
      setPairingBusy(false);
    }
  }

  async function handleRevokeSession(sessionId: string) {
    setExtensionError(null);
    try {
      await api.delete(`/extension/sessions/${sessionId}`);
      refetchSessions();
      onSessionChanged?.();
    } catch (err) {
      setExtensionError(
        err instanceof ApiError ? err.detail : "Failed to revoke session."
      );
    }
  }

  return (
    <Card>
      <CardHeader title={title} description={description} />
      {extensionError && (
        <div className="mb-3">
          <Alert tone="error">{extensionError}</Alert>
        </div>
      )}

      <form onSubmit={handleGeneratePairingToken} className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <TextField
            label="Device label"
            value={deviceLabel}
            onChange={(e) => setDeviceLabel(e.target.value)}
            placeholder="Work Laptop Chrome"
          />
        </div>
        <Button type="submit" loading={pairingBusy}>
          Generate pairing token
        </Button>
      </form>

      {pairingToken && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
          <p className="font-medium text-emerald-900">
            Copy this pairing token now — it won&apos;t be shown again:
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded bg-white px-2.5 py-1.5 font-mono text-xs text-ui-ink">
              {pairingToken}
            </code>
            <Button
              type="button"
              variant="secondary"
              className="px-3 py-1.5 text-xs"
              onClick={() => {
                void navigator.clipboard.writeText(pairingToken);
                setCopiedToken(true);
              }}
            >
              {copiedToken ? "Copied" : "Copy"}
            </Button>
          </div>
          <p className="mt-2 text-xs text-emerald-800">
            Load <code>apps/extension/dist</code> as an unpacked extension in Chrome, then paste this token in the ApplyFocus popup.
          </p>
        </div>
      )}

      <div className="mt-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ui-muted">
          Extension sessions
        </p>
        {sessionsLoading ? (
          <div className="h-12 animate-pulse rounded bg-ui-linen" />
        ) : sessions && sessions.length > 0 ? (
          <ul className="flex flex-col divide-y divide-slate-100 text-sm">
            {sessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="font-medium text-ui-ink">{s.label}</p>
                  <p className="text-xs text-ui-muted">
                    Created {new Date(s.createdAt).toLocaleDateString()}
                    {s.lastUsedAt
                      ? ` · Last used ${new Date(s.lastUsedAt).toLocaleString()}`
                      : " · Not used yet"}
                  </p>
                </div>
                {s.revokedAt ? (
                  <Badge className="bg-ui-linen text-ui-muted">Revoked</Badge>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRevokeSession(s.id)}
                    className="rounded px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Revoke
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ui-muted">No paired extension sessions yet.</p>
        )}
      </div>
    </Card>
  );
}

