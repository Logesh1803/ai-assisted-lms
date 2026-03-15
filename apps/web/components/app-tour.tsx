"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useCallback } from "react";
import type { Step, CallBackProps } from "react-joyride";

const Joyride = dynamic(() => import("react-joyride"), { ssr: false });

const STORAGE_KEY = {
  STUDENT: "thinkbloom_tour_done_student",
  TEACHER: "thinkbloom_tour_done_teacher",
} as const;

const STUDENT_STEPS: Step[] = [
  {
    target: "#tour-sidebar-logo",
    content: (
      <div>
        <p className="font-semibold text-base mb-1">Welcome to ThinkBloom!</p>
        <p className="text-sm text-muted-foreground">
          Your AI-powered learning platform. Let&apos;s take a quick tour to get you started.
        </p>
      </div>
    ),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: "#tour-nav-dashboard",
    content: (
      <div>
        <p className="font-semibold text-base mb-1">Dashboard</p>
        <p className="text-sm text-muted-foreground">
          Your home base — see your enrolled courses, progress stats, and available courses at a glance.
        </p>
      </div>
    ),
    placement: "right",
  },
  {
    target: "#tour-nav-courses",
    content: (
      <div>
        <p className="font-semibold text-base mb-1">Browse Courses</p>
        <p className="text-sm text-muted-foreground">
          Explore all available courses and enroll with a single click. Courses are sorted and searchable.
        </p>
      </div>
    ),
    placement: "right",
  },
  {
    target: "#tour-nav-my-learning",
    content: (
      <div>
        <p className="font-semibold text-base mb-1">My Learning</p>
        <p className="text-sm text-muted-foreground">
          Track all your enrolled courses and pick up right where you left off.
        </p>
      </div>
    ),
    placement: "right",
  },
  {
    target: "#tour-nav-performance",
    content: (
      <div>
        <p className="font-semibold text-base mb-1">Performance</p>
        <p className="text-sm text-muted-foreground">
          Review your quiz scores, course progress, and learning achievements over time.
        </p>
      </div>
    ),
    placement: "right",
  },
  {
    target: "#tour-nav-chatbot",
    content: (
      <div>
        <p className="font-semibold text-base mb-1">AI Chat</p>
        <p className="text-sm text-muted-foreground">
          Ask anything! The AI assistant explains concepts, answers questions, and helps you study.
        </p>
      </div>
    ),
    placement: "right",
  },
  {
    target: "#tour-nav-ai-video",
    content: (
      <div>
        <p className="font-semibold text-base mb-1">Video Analysis</p>
        <p className="text-sm text-muted-foreground">
          Upload or link a video and let AI summarize, transcribe, and extract key insights for you.
        </p>
      </div>
    ),
    placement: "right",
  },
];

const TEACHER_STEPS: Step[] = [
  {
    target: "#tour-sidebar-logo",
    content: (
      <div>
        <p className="font-semibold text-base mb-1">Welcome to ThinkBloom!</p>
        <p className="text-sm text-muted-foreground">
          Your AI-powered teaching platform. Here&apos;s a quick overview to get you up and running.
        </p>
      </div>
    ),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: "#tour-nav-dashboard",
    content: (
      <div>
        <p className="font-semibold text-base mb-1">Dashboard</p>
        <p className="text-sm text-muted-foreground">
          Your overview — total courses, published count, student enrollments, and quiz attempts at a glance.
        </p>
      </div>
    ),
    placement: "right",
  },
  {
    target: "#tour-nav-courses",
    content: (
      <div>
        <p className="font-semibold text-base mb-1">My Courses</p>
        <p className="text-sm text-muted-foreground">
          Create, manage, and publish your courses. Use AI to auto-generate a full course from a description.
        </p>
      </div>
    ),
    placement: "right",
  },
  {
    target: "#tour-nav-students",
    content: (
      <div>
        <p className="font-semibold text-base mb-1">Students</p>
        <p className="text-sm text-muted-foreground">
          Monitor each student&apos;s progress, lesson completion, and quiz scores across your courses.
        </p>
      </div>
    ),
    placement: "right",
  },
];

type Props = { role: "STUDENT" | "TEACHER" };

export function AppTour({ role }: Props) {
  const [run, setRun] = useState(false);
  const storageKey = role === "STUDENT" ? STORAGE_KEY.STUDENT : STORAGE_KEY.TEACHER;
  const steps = role === "STUDENT" ? STUDENT_STEPS : TEACHER_STEPS;

  useEffect(() => {
    const done = localStorage.getItem(storageKey);
    if (!done) {
      // slight delay so layout has mounted and IDs are in the DOM
      const t = setTimeout(() => setRun(true), 600);
      return () => clearTimeout(t);
    }
  }, [storageKey]);

  const handleCallback = useCallback(
    (data: CallBackProps) => {
      const { status, action } = data;
      if (status === "finished" || status === "skipped" || action === "close") {
        localStorage.setItem(storageKey, "1");
        setRun(false);
      }
    },
    [storageKey]
  );

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep={false}
      disableScrolling
      callback={handleCallback}
      styles={{
        options: {
          primaryColor: "#7c3aed",
          zIndex: 10000,
          arrowColor: "var(--background, #fff)",
          backgroundColor: "var(--background, #fff)",
          textColor: "var(--foreground, #09090b)",
          overlayColor: "rgba(0,0,0,0.45)",
        },
        tooltip: {
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          fontSize: "14px",
          minWidth: "260px",
          maxWidth: "320px",
        },
        tooltipTitle: { display: "none" },
        buttonNext: {
          backgroundColor: "#7c3aed",
          borderRadius: "8px",
          padding: "8px 16px",
          fontSize: "13px",
          fontWeight: 600,
        },
        buttonBack: {
          color: "#7c3aed",
          marginRight: "8px",
          fontSize: "13px",
        },
        buttonSkip: {
          color: "#71717a",
          fontSize: "13px",
        },
        buttonClose: {
          display: "none",
        },
        beacon: {
          backgroundColor: "#7c3aed",
          borderColor: "#7c3aed33",
        } as React.CSSProperties,
      }}
      locale={{
        back: "Back",
        close: "Close",
        last: "Done",
        next: "Next",
        skip: "Skip tour",
      }}
    />
  );
}
