import { useEffect, useState, useCallback, useMemo, Fragment } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Population = {
  amount: number;
  growth: number;
};

const colors = ["#8884d8", "#a5b4fc", "#6366f1", "#2563eb", "#312e81"];

function App() {
  const [numberOfPopulations, setNumberOfPopulations] = useState(2);

  const [deseaseSpawnrate, setDeseaseSpawnrate] = useState(0);

  const [coeffs, setCoeffs] = useState<number[][]>(
    new Array(numberOfPopulations)
      .fill(new Array(numberOfPopulations).fill(0.0001))
      .map((row, rowIdx) =>
        row.map((num: number, colIdx: number) => (rowIdx === colIdx ? 0 : num))
      )
  );

  const [deseaseResistanceCoeffs, setDeseaseResistanceCoeffs] = useState<
    number[]
  >(new Array(numberOfPopulations).fill(1));

  const [seasonsDependency, setSeasonsDependency] = useState(false);

  const [seasonsDependencyCoeff, setSeasonsDependecyCoeff] = useState(2);

  const [simulationStep, setSimulationStep] = useState(1);

  const [populations, setPopulations] = useState<Population[]>(
    new Array(numberOfPopulations)
      .fill(0)
      .map(() => ({ amount: 100, growth: 0.01 }))
  );

  const [simulationDuration, setSimulationDuration] = useState(5000);

  const [data, setData] = useState<Record<string, number>[]>(
    new Array(1).fill(0).map(() => {
      const obj = {
        day: 0,
      } as Record<string, number>;
      for (let i = 0; i < numberOfPopulations; ++i) {
        obj[i] = populations[i]?.amount ?? 100;
      }
      return obj;
    })
  );

  const totalPopulationAmount = useMemo(() => {
    let total = 0;
    for (let i = 0; i < numberOfPopulations; ++i) {
      total += data[data.length - 1][i];
    }
    return total;
  }, [data, numberOfPopulations]);

  const [start, setStart] = useState(false);

  useEffect(() => {
    setPopulations(
      new Array(numberOfPopulations)
        .fill(0)
        .map(() => ({ amount: 100, growth: 0.01 }))
    );
    setCoeffs(
      new Array(numberOfPopulations)
        .fill(new Array(numberOfPopulations).fill(0.0001))
        .map((row, rowIdx) =>
          row.map((num: number, colIdx: number) =>
            rowIdx === colIdx ? 0 : num
          )
        )
    );
    setDeseaseResistanceCoeffs(new Array(numberOfPopulations).fill(1));
  }, [numberOfPopulations]);

  useEffect(() => {
    setData(
      new Array(1).fill(0).map(() => {
        const obj = {
          day: 0,
        } as Record<string, number>;
        for (let i = 0; i < numberOfPopulations; ++i) {
          obj[i] = populations[i]?.amount ?? 100;
        }
        return obj;
      })
    );
  }, [populations, numberOfPopulations]);

  const handleSeasonsDependencyChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSeasonsDependency(event.target.checked);
    },
    []
  );

  const handleNumberOfPopulationsChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setNumberOfPopulations(+event.target.value);
    },
    []
  );

  const handleSimulationDurationChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSimulationDuration(+event.target.value);
    },
    []
  );

  const handleSimulationStepChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSimulationStep(+event.target.value);
    },
    []
  );

  const handleSeasonsDependencyCoeffChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSeasonsDependecyCoeff(+event.target.value);
    },
    []
  );

  const handleDeseaseSpawnrateChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setDeseaseSpawnrate(+event.target.value);
    },
    []
  );

  const handleClick = useCallback(() => {
    setStart((p) => !p);
  }, []);

  useEffect(() => {
    let requestId: number;
    let day = 0;
    const startSimulation = () => {
      if (!start) {
        return;
      }
      if (day > simulationDuration) {
        cancelAnimationFrame(requestId);
        return;
      }
      setData((p) => {
        const currentData = p[p.length - 1];
        const newData = {
          ...currentData,
          day: currentData.day + simulationStep,
        } as Record<string, number>;
        for (let k = 0; k < simulationStep; ++k) {
          for (let i = 0; i < numberOfPopulations; ++i) {
            const N = newData[i];
            let growth = populations[i].growth;
            const currentDay = day % 365;
            /* Winter check */
            if (seasonsDependency && (currentDay < 58 || currentDay >= 335)) {
              growth =
                growth > 0
                  ? growth * (1 / seasonsDependencyCoeff)
                  : growth * seasonsDependencyCoeff;
              /* Summer check */
            } else if (
              seasonsDependency &&
              currentDay >= 149 &&
              currentDay <= 239
            ) {
              growth =
                growth > 0
                  ? growth * seasonsDependencyCoeff
                  : growth * (1 / seasonsDependencyCoeff);
            }
            let dN = N * growth;
            for (let j = 0; j < numberOfPopulations; ++j) {
              dN += coeffs[i][j] * N * newData[j];
            }
            newData[i] = N + dN;
            if (Math.random() < deseaseSpawnrate) {
              newData[i] *= deseaseResistanceCoeffs[i];
            }
          }
        }
        return [...p, newData];
      });
      day += simulationStep;
      requestId = requestAnimationFrame(startSimulation);
    };
    start && startSimulation();

    return () => {
      requestId && cancelAnimationFrame(requestId);
    };
  }, [
    simulationDuration,
    numberOfPopulations,
    populations,
    coeffs,
    start,
    simulationStep,
    seasonsDependency,
    seasonsDependencyCoeff,
    deseaseSpawnrate,
    deseaseResistanceCoeffs,
  ]);

  return (
    <Fragment>
      <div
        style={{
          display: "flex",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: 20,
          }}
        >
          <label
            style={{ display: "flex", flexDirection: "column" }}
            htmlFor="numberOfPopulations"
          >
            number of populations
            <input
              type="number"
              id="numberOfPopulations"
              value={numberOfPopulations}
              onChange={handleNumberOfPopulationsChange}
              placeholder="number of populations"
            />
          </label>
          <div
            style={{
              width: "100%",
              height: 1,
              backgroundColor: "#ccc",
              margin: "16px 0",
            }}
          />
          {populations.map((population, index) => (
            <div key={index} style={{ marginTop: index ? 16 : 0 }}>
              <p>population number {index + 1}</p>
              <label
                style={{ display: "flex", flexDirection: "column" }}
                htmlFor={`amount${index}`}
              >
                population amount
                <input
                  type="number"
                  id={`amount${index}`}
                  value={population.amount}
                  onChange={(event) =>
                    setPopulations((p) =>
                      p.map((p, idx) =>
                        idx === index
                          ? {
                              ...p,
                              amount: +event.target.value,
                            }
                          : p
                      )
                    )
                  }
                  placeholder="number of populations"
                />
              </label>
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  marginTop: 8,
                }}
                htmlFor={`growth${index}`}
              >
                population growth
                <input
                  type="number"
                  id={`growth${index}`}
                  value={population.growth}
                  onChange={(event) =>
                    setPopulations((p) =>
                      p.map((p, idx) =>
                        idx === index
                          ? {
                              ...p,
                              growth: +event.target.value,
                            }
                          : p
                      )
                    )
                  }
                  placeholder="number of populations"
                />
              </label>
            </div>
          ))}
        </div>
        <div
          style={{
            marginLeft: 20,
            display: "flex",
            flexDirection: "column",
            padding: 20,
          }}
        >
          <div>population interaction coefficients</div>
          {coeffs.map((row, rowIdx) => (
            <div key={rowIdx} style={{ display: "flex" }}>
              {row.map((coeff, colIdx) => (
                <input
                  key={`${rowIdx}${colIdx}`}
                  onChange={(e) =>
                    setCoeffs((p) =>
                      p.map((row, rowIndex) =>
                        row.map((num, colIndex) =>
                          rowIdx === rowIndex && colIdx === colIndex
                            ? +e.target.value
                            : num
                        )
                      )
                    )
                  }
                  type="number"
                  value={coeff}
                />
              ))}
            </div>
          ))}
          <label
            style={{ marginTop: 20, display: "flex", flexDirection: "column" }}
            htmlFor="simulationDuration"
          >
            simulation duration amount
            <input
              id="sumulationDuration"
              type="number"
              placeholder="days"
              value={simulationDuration}
              onChange={handleSimulationDurationChange}
            />
          </label>
          <label
            htmlFor="simulationStep"
            style={{ marginTop: 20, display: "flex", flexDirection: "column" }}
          >
            simulation step
            <input
              id="sumulationStep"
              type="number"
              placeholder="step"
              value={simulationStep}
              onChange={handleSimulationStepChange}
            />
          </label>
          <button style={{ marginTop: 16 }} onClick={handleClick}>
            {start ? "stop" : "start"}
          </button>
          <div style={{ marginTop: 16 }}>
            <p>simulation information: </p>
            <p>total population amount {totalPopulationAmount.toFixed(2)}</p>
            <p>current day {data[data.length - 1].day}</p>
          </div>
        </div>
        <div
          style={{ marginTop: 16, display: "flex", flexDirection: "column" }}
        >
          <label
            htmlFor="seasonsDependency"
            style={{ display: "inline-flex", alignItems: "center" }}
          >
            seasons dependency
            <input
              id="seasonsDependency"
              type="checkbox"
              checked={seasonsDependency}
              onChange={handleSeasonsDependencyChange}
              style={{ marginLeft: 10 }}
            />
          </label>
          <label
            htmlFor="seasonsDependecy"
            style={{ marginTop: 16, display: "flex", flexDirection: "column" }}
          >
            seasons dependency coeff
            <input
              id="seasonsDependency"
              type="number"
              value={seasonsDependencyCoeff}
              onChange={handleSeasonsDependencyCoeffChange}
            />
          </label>
        </div>
        <div style={{ marginTop: 16, marginLeft: 20 }}>
          <label
            htmlFor="deseaseSpawnrate"
            style={{ display: "flex", flexDirection: "column" }}
          >
            illness spawnrate
            <input
              type="number"
              min={0}
              max={1}
              step={0.01}
              id="deseaseSpawnrate"
              value={deseaseSpawnrate}
              onChange={handleDeseaseSpawnrateChange}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column" }}>
            illness resistance coeffs
            {deseaseResistanceCoeffs.map((value, index) => (
              <input
                key={index}
                type="number"
                placeholder={`Population ${index + 1}`}
                value={value}
                onChange={(event) =>
                  setDeseaseResistanceCoeffs((p) =>
                    p.map((value, valueIndex) =>
                      index === valueIndex ? +event.target.value : value
                    )
                  )
                }
              />
            ))}
          </label>
        </div>
      </div>
      <LineChart
        width={1000}
        height={300}
        data={data}
        margin={{
          top: 50,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" />
        <YAxis />
        <Tooltip />
        {populations.map((_, index) => (
          <Line
            key={index}
            type="monotone"
            dataKey={index}
            stroke={colors[index % colors.length]}
            dot={false}
          />
        ))}
      </LineChart>
    </Fragment>
  );
}

export default App;
