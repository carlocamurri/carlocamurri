import { JobFilter, JobGroup, JobOrder } from "../model"

export interface GroupJobsService {
  groupJobs(
    filters: JobFilter[],
    order: JobOrder,
    groupedField: string,
    aggregates: string[],
    skip: number,
    take: number,
    signal: AbortSignal | undefined,
  ): Promise<JobGroup[]>
}
