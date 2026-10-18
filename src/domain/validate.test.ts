import { describe, expect, it } from "vitest";
import { createEventFormValues, validateEvent } from "./validate";

describe("createEventFormValues", () => {
  it("prefills the calendar date when creating a new event", () => {
    expect(createEventFormValues(undefined, "2026-10-21").date).toBe("2026-10-21");
  });

  it("keeps an existing event date when editing", () => {
    expect(createEventFormValues({ date: "2026-10-14" }, "2026-10-21").date).toBe("2026-10-14");
  });
});

describe("validateEvent", () => {
  it("requires date, time, and tpo", () => {
    const errors = validateEvent({ date: "", time: "", tpo: "", formality: "", placeType: "" });
    expect(errors.date).toBeTruthy();
    expect(errors.time).toBeTruthy();
    expect(errors.tpo).toBeTruthy();
  });

  it("accepts a complete event", () => {
    const errors = validateEvent({
      date: "2026-10-14",
      time: "09:00",
      tpo: "work",
      formality: "medium",
      placeType: "오피스",
    });
    expect(errors).toEqual({});
  });
});
