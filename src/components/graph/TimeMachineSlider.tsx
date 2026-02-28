"use client";

import { useState, useCallback } from "react";
import { Clock } from "lucide-react";
import styles from "./TimeMachineSlider.module.css";

export interface SnapshotMeta {
  id: string;
  uploadId: string;
  systemCount: number;
  edgeCount: number;
  createdAt: string;
  upload: { filename: string };
}

interface TimeMachineSliderProps {
  snapshots: SnapshotMeta[];
  onSnapshotSelect: (snapshotId: string | null) => void;
  isLoading?: boolean;
}

export function TimeMachineSlider({
  snapshots,
  onSnapshotSelect,
  isLoading,
}: TimeMachineSliderProps) {
  const totalStops = snapshots.length + 1;
  const [index, setIndex] = useState(totalStops - 1);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newIndex = parseInt(e.target.value, 10);
      setIndex(newIndex);
      if (newIndex === snapshots.length) {
        onSnapshotSelect(null);
      } else {
        const snapshot = snapshots[newIndex];
        if (snapshot) {
          onSnapshotSelect(snapshot.id);
        }
      }
    },
    [snapshots, onSnapshotSelect],
  );

  const isLive = index === snapshots.length;
  const current = !isLive ? snapshots[index] : null;
  const label = current
    ? new Date(current.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    : "Live";

  if (snapshots.length === 0) return null;

  return (
    <div className={styles.container}>
      <Clock className="size-4" />
      <input
        type="range"
        min={0}
        max={totalStops - 1}
        value={index}
        onChange={handleChange}
        className={styles.slider}
        disabled={isLoading}
      />
      <span className={styles.label}>
        {isLoading ? (
          <span className={styles.meta}>Loading...</span>
        ) : (
          <>
            {label}
            {current && (
              <span className={styles.meta}>
                {current.systemCount} systems
              </span>
            )}
            {isLive && <span className={styles.liveBadge}>LIVE</span>}
          </>
        )}
      </span>
    </div>
  );
}
