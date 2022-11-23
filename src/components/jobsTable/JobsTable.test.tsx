import React from "react"
import { expect, jest } from "@jest/globals"
import { render, within, waitFor, waitForElementToBeRemoved, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Job } from "model"
import GetJobsService from "services/GetJobsService"
import GroupJobsService from "services/GroupJobsService"
import FakeGetJobsService from "services/mocks/FakeGetJobsService"
import FakeGroupJobsService from "services/mocks/FakeGroupJobsService"
import { makeTestJobs } from "utils"
import { JobsTable } from "./JobsTable"
import { DEFAULT_COLUMN_SPECS } from "utils/jobsTableColumns"

describe("JobsTable", () => {
  let numQueues = 2, numJobSets = 3;
  let jobs: Job[], getJobsService: GetJobsService, groupJobsService: GroupJobsService

  beforeEach(() => {
    jobs = makeTestJobs(5, 1)
    getJobsService = new FakeGetJobsService(jobs)
    groupJobsService = new FakeGroupJobsService(jobs)
  })

  const renderComponent = () =>
    render(
      <JobsTable
        getJobsService={getJobsService}
        groupJobsService={groupJobsService}
      />,
    )

  it("should render a spinner while loading initially", async () => {
    getJobsService.getJobs = jest.fn(() => new Promise(() => undefined))
    const { findByRole } = renderComponent()
    await findByRole("progressbar")
  })

  it("should handle no data", async () => {
    getJobsService.getJobs = jest.fn(() =>
      Promise.resolve({
        jobs: [],
        totalJobs: 0,
      }),
    )
    const { findByText, getByRole } = renderComponent()
    await waitForElementToBeRemoved(() => getByRole("progressbar"))

    await findByText("There is no data to display")
    await findByText("0–0 of 0")
  })

  it("should show jobs by default", async () => {
    const { findByRole, getByRole } = renderComponent()
    await waitForElementToBeRemoved(() => getByRole("progressbar"))

    // Check all details for the first job are shown
    const jobToSearchFor = jobs[0]
    const matchingRow = await findByRole("row", { name: "job:" + jobToSearchFor.jobId })
    DEFAULT_COLUMN_SPECS.forEach((col) => {
      const cellValue = jobToSearchFor[col.key as keyof Job]
      const expectedText = col.formatter?.(cellValue) ?? cellValue
      within(matchingRow).getByText(expectedText!.toString()) // eslint-disable-line @typescript-eslint/no-non-null-assertion
    })

    await assertNumDataRowsShown(jobs.length)
  })

  it.each([
    ["Job Set", "jobSet"],
    ["Queue", "queue"],
    ["State", "state"],
  ])("should allow grouping by %s", async (displayString, groupKey) => {
    const jobObjKey = groupKey as keyof Job

    const numUniqueForJobKey = new Set(jobs.map((j) => j[jobObjKey])).size

    const { getByRole } = renderComponent()
    await waitForElementToBeRemoved(() => getByRole("progressbar"))

    await groupByColumn(displayString)

    // Check number of rendered rows has changed
    await assertNumDataRowsShown(numUniqueForJobKey)

    // Expand a row
    const job = jobs[0]
    await expandRow(job[jobObjKey]!.toString()) // eslint-disable-line @typescript-eslint/no-non-null-assertion

    // Check the row right number of rows is being shown
    const numShownJobs = jobs.filter((j) => j[jobObjKey] === job[jobObjKey]).length
    await assertNumDataRowsShown(numUniqueForJobKey + numShownJobs)
  })

  it("should allow 2 level grouping", async () => {
    jobs = makeTestJobs(6, 1, numQueues, numJobSets)
    getJobsService = new FakeGetJobsService(jobs)
    groupJobsService = new FakeGroupJobsService(jobs)

    const { getByRole } = renderComponent()
    await waitForElementToBeRemoved(() => getByRole("progressbar"))

    // Group to both levels
    await groupByColumn("Queue")
    await groupByColumn("Job Set")
    await assertNumDataRowsShown(numQueues)

    const job = jobs[1] // Pick the second job as a bit of variation

    // Expand the first level
    await expandRow(job.queue)
    await assertNumDataRowsShown(numQueues + numJobSets)

    // Expand the second level
    await expandRow(job.jobSet)
    await assertNumDataRowsShown(numQueues + numJobSets + 1)
  })

  it("should allow 3 level grouping", async () => {
    jobs = makeTestJobs(1000, 1, numQueues, numJobSets)
    getJobsService = new FakeGetJobsService(jobs)
    groupJobsService = new FakeGroupJobsService(jobs)

    const numStates = new Set(jobs.map((j) => j.state)).size

    const { getByRole } = renderComponent()
    await waitForElementToBeRemoved(() => getByRole("progressbar"))

    // Group to 3 levels
    await groupByColumn("State")
    await groupByColumn("Job Set")
    await groupByColumn("Queue")
    await assertNumDataRowsShown(numStates)

    const job = jobs[0]

    // Expand the first level
    await expandRow(job.state)
    await assertNumDataRowsShown(numStates + numJobSets)

    // Expand the second level
    await expandRow(job.jobSet)
    await assertNumDataRowsShown(numStates + numJobSets + numQueues)

    // Expand the third level
    await expandRow(job.queue)
    const numJobsExpectedToShow = jobs.filter(
      (j) => j.state === job.state && j.jobSet === job.jobSet && j.queue === job.queue,
    ).length
    await assertNumDataRowsShown(numStates + numJobSets + numQueues + numJobsExpectedToShow)
  })

  it("should reset currently-expanded if grouping changes", async () => {
    jobs = makeTestJobs(5, 1, numQueues, numJobSets)
    getJobsService = new FakeGetJobsService(jobs)
    groupJobsService = new FakeGroupJobsService(jobs)

    const { getByRole, queryAllByRole } = renderComponent()
    await waitForElementToBeRemoved(() => getByRole("progressbar"))

    await groupByColumn("Queue")

    // Check we're only showing one row for each queue
    await assertNumDataRowsShown(numQueues)

    // Expand a row
    const job = jobs[0]
    await expandRow(job.queue)

    // Check the row right number of rows is being shown
    const numShownJobs = jobs.filter((j) => j.queue === job.queue).length
    await assertNumDataRowsShown(numQueues + numShownJobs)

    // Assert arrow down icon is shown
    getByRole("button", { name: "Collapse row" })

    // Group by another header
    await groupByColumn("Job Set")

    // Verify all rows are now collapsed
    waitForElementToBeRemoved(() => queryAllByRole("button", { name: "Expand row" }))
  })

  async function assertNumDataRowsShown(nDataRows: number) {
    await waitFor(async () => {
      const rows = await screen.findAllByRole("row")
      expect(rows.length).toBe(nDataRows + 1) // One row per data row, plus the header row
    })
  }

  async function groupByColumn(columnDisplayName: string) {
    const groupByDropdownButton = await screen.findByRole("button", {name: "Group by"})
    userEvent.click(groupByDropdownButton);

    const dropdown = await screen.findByRole("listbox");
    const colToGroup = await within(dropdown).findByText(columnDisplayName);
    userEvent.click(colToGroup)
  }

  async function expandRow(buttonText: string) {
    const rowToExpand = await screen.findByRole("row", {
      name: new RegExp(buttonText),
    })
    const expandButton = within(rowToExpand).getByRole("button", { name: "Expand row" })
    userEvent.click(expandButton)
  }
})
