import React, { useEffect, useMemo, useRef, useState } from "react"

import { createTheme, ThemeProvider } from "@mui/material"
import { grey, red } from "@mui/material/colors"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import "ag-grid-enterprise"
import "ag-grid-community/styles/ag-grid.css"
import "ag-grid-community/styles/ag-theme-alpine.css"

import JobsPage from "./JobsPage"
import NavBar from "./NavBar"
import FakeGetJobsService from "./services/mocks/FakeGetJobsService"
import FakeGroupJobsService from "./services/mocks/FakeGroupJobsService"
import { makeTestJobs } from "./util"

import "./App.css"

const theme = createTheme({
  palette: {
    primary: {
      main: "#00aae1",
      contrastText: "#fff",
    },
    secondary: {
      main: grey.A100,
    },
    error: {
      main: red.A400,
    },
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      "'Segoe UI'",
      "'Roboto'",
      "'Oxygen'",
      "'Ubuntu'",
      "'Cantarell'",
      "'Fira Sans'",
      "'Droid Sans'",
      "'Helvetica Neue'",
      "sans-serif",
    ].join(","),
  },
})

const NAVBAR_HEIGHT = 64

function App() {
  const [dims, setDims] = useState({ width: 0, height: 0 })

  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleResize = () => {
      if (ref && ref.current) {
        setDims({
          width: ref.current.clientWidth,
          height: ref.current.clientHeight,
        })
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  const testJobs = useMemo(() => makeTestJobs(10000, 42), [])

  return (
    <ThemeProvider theme={theme}>
      <div ref={ref} className="App">
        <BrowserRouter>
          <NavBar height={NAVBAR_HEIGHT} width={dims.width} />
          <Routes>
            <Route
              path="/"
              element={
                <JobsPage
                  height={dims.height - NAVBAR_HEIGHT}
                  width={dims.width}
                  getJobsService={new FakeGetJobsService(testJobs)}
                  groupJobsService={new FakeGroupJobsService(testJobs)}
                />
              }
            />
          </Routes>
        </BrowserRouter>
      </div>
    </ThemeProvider>
  )
}

export default App
