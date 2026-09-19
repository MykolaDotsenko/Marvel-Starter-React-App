import { useCallback, useEffect, useState } from "react";
import {
  normalizeViewMode,
  sanitizeSearchTerm,
} from "../domain/reading.js";

const readUrlState = () => {
  const params = new URLSearchParams(window.location.search);
  const rawIssueId = Number(params.get("issue"));

  return {
    query: sanitizeSearchTerm(params.get("q") ?? ""),
    issueId:
      Number.isInteger(rawIssueId) && rawIssueId > 0 ? rawIssueId : null,
    view: normalizeViewMode(params.get("view")),
  };
};

export const useUrlState = () => {
  const [state, setState] = useState(readUrlState);

  useEffect(() => {
    const onPopState = () => setState(readUrlState());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const updateUrlState = useCallback((patch, { replace = false } = {}) => {
    const next = { ...readUrlState(), ...patch };
    const params = new URLSearchParams();

    if (next.query) params.set("q", sanitizeSearchTerm(next.query));
    if (next.issueId) params.set("issue", String(next.issueId));
    if (next.view && next.view !== "explore") {
      params.set("view", normalizeViewMode(next.view));
    }

    const search = params.toString();
    const nextUrl = `${window.location.pathname}${search ? `?${search}` : ""}`;

    window.history[replace ? "replaceState" : "pushState"]({}, "", nextUrl);
    setState(readUrlState());
  }, []);

  return [state, updateUrlState];
};
