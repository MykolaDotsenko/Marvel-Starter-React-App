import { useEffect, useState } from "react";
import { getIssue } from "../api/marvelMetadataClient.js";

const emptyState = {
  requestId: null,
  issue: null,
  error: null,
};

export const useIssueDetails = (issueId, { onLoaded } = {}) => {
  const [state, setState] = useState(emptyState);

  useEffect(() => {
    if (!issueId) return undefined;

    const controller = new AbortController();

    getIssue(issueId, { signal: controller.signal })
      .then((issue) => {
        setState({
          requestId: issueId,
          issue,
          error: null,
        });
        onLoaded?.(issue);
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setState({
          requestId: issueId,
          issue: null,
          error,
        });
      });

    return () => controller.abort();
  }, [issueId, onLoaded]);

  if (!issueId) return { issue: null, loading: false, error: null };
  if (state.requestId !== issueId) {
    return { issue: null, loading: true, error: null };
  }

  return {
    issue: state.issue,
    loading: false,
    error: state.error,
  };
};
