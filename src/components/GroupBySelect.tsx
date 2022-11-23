import React from "react"

import { Clear } from "@mui/icons-material"
import { Divider, FormControl, IconButton, InputLabel, MenuItem, OutlinedInput, Select, TextField } from "@mui/material"

import styles from "./GroupBySelect.module.css"
import { ColumnId, ColumnSpec } from "utils/jobsTableColumns"

type GroupColumnProps = {
  columns: ColumnSpec[]
  groups: ColumnId[]
  currentlySelected: ColumnId | ""
  onSelect: (columnKey: ColumnId) => void
  onDelete: () => void
}

type GroupBySelectProps = {
  groups: ColumnId[]
  columns: ColumnSpec[]
  onGroupsChanged: (newGroups: ColumnId[]) => void
}

function isGroupable(column: ColumnSpec): boolean {
  return column.groupable
}

function GroupColumn({ columns, currentlySelected, onSelect, onDelete }: GroupColumnProps) {
  const isGrouped = currentlySelected !== "";
  const actionText = isGrouped ? 'Grouped by' : 'Group by';
  return (
    <FormControl size="small"
    >
      <InputLabel
        id="select-column-group"
        size="small"
      >
        {actionText}
      </InputLabel>
      <Select
        labelId="select-column-group"
        value={currentlySelected}
        size="small"
        sx={{
          minWidth: 110,
          paddingRight: "0.5em",
          "& .MuiSelect-iconOutlined": { display: isGrouped ? 'none' : '' }
        }}
        input={<OutlinedInput label={actionText} />}
        endAdornment={(isGrouped &&
          <IconButton size="small" sx={{ padding: 0 }} onClick={onDelete}>
            <Clear aria-label="Clear grouping" aria-hidden="false"/>
          </IconButton>
        )}
      >
        {columns.map((col) => (
          <MenuItem
            key={col.key}
            value={col.key}
            disabled={currentlySelected === col.key}
            onClick={() => onSelect(col.key)}
          >
            {col.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default function GroupBySelect({ groups, columns, onGroupsChanged }: GroupBySelectProps) {
  const groupableColumns = columns.filter(isGroupable);
  const ungroupedColumns = groupableColumns.filter(c => !groups.includes(c.key))
  return (
    <div className={styles.container}>
      {/* Controls to modify/remove selected groups */}
      {groups.map((key, i) => {
        const alreadyListed = groups.slice(0, i)
        const remainingOptions = groupableColumns.filter(c => !alreadyListed.includes(c.key))
        return (
          <React.Fragment key={key}>
            <GroupColumn
              columns={remainingOptions}
              groups={groups}
              currentlySelected={key}
              onSelect={(newKey) => {
                // Resets everything to the right
                onGroupsChanged(alreadyListed.concat([newKey]))
              }}
              onDelete={() => {
                onGroupsChanged(groups.filter((_, idx) => idx !== i))
              }}
            />
            {remainingOptions.length > 1 && <Divider style={{ width: 10 }} />}
          </React.Fragment>
        )
      })}

      {/* Control for adding a new group */}
      {ungroupedColumns.length > 0 && <GroupColumn
        key="new-group"
        columns={ungroupedColumns}
        groups={groups}
        currentlySelected={""}
        onSelect={(newKey) => {
          onGroupsChanged(groups.concat([newKey]))
        }}
        onDelete={() => null}
      />}
    </div>
  )
}
