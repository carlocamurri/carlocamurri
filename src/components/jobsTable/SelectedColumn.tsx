import { Checkbox as MuiCheckbox } from "@mui/material"
import { ColumnDef } from "@tanstack/react-table"
import { JobTableRow } from "models/jobsTableModels"
import { memo, useCallback, useMemo } from "react"
import { ColumnId } from "utils/jobsTableColumns"

const Checkbox = memo(MuiCheckbox)

export const SELECT_COLUMN_ID: ColumnId = "selectorCol"
export const getSelectedColumnDef = (): ColumnDef<JobTableRow> => {
  return {
    id: SELECT_COLUMN_ID,
    minSize: 5,
    size: 5,
    maxSize: 5,
    aggregatedCell: undefined,
    header: ({ table }) => {
      return (
        <Checkbox
          checked={table.getIsAllRowsSelected()}
          indeterminate={table.getIsSomeRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          size="small"
        />
      )
    },
    cell: ({ row }) => {
      return (
        <Checkbox
          checked={row.getIsGrouped() ? row.getIsAllSubRowsSelected() : row.getIsSelected()}
          indeterminate={row.getIsSomeSelected()}
          onChange={useCallback(row.getToggleSelectedHandler(), [row])}
          size="small"
          sx={useMemo(
            () => ({
              marginLeft: `${row.depth}em`,
            }),
            [],
          )}
        />
      )
    },
  }
}