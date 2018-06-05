import fs = require('fs');

import {formatDuration, formatTime} from '../../format-result';
import {readFlight} from '../../read-flight';
import {readTask} from '../../read-task';
import Task from '../task';
import RacingTaskSolver from './racing-task-solver';

const FIXTURES_PATH = `${__dirname}/../../../fixtures`;

const FIXTURES = [
  ['2017-07-17-lev', null],
  ['2017-07-17-lev', '2017-07-17T17:00:00Z'],
];

describe('RacingTaskSolver', () => {
  for (let [fixtureName, maxTime] of FIXTURES) {
    let testName = fixtureName!;
    if (maxTime !== null) {
      testName += ` until ${maxTime}`;
    }

    let maxT = Date.parse(maxTime!);

    test(testName, () => {
      let task = readTask(`${FIXTURES_PATH}/${fixtureName}/task.tsk`);
      let handicaps = readCSV(`${FIXTURES_PATH}/${fixtureName}/filter.csv`);

      // Lowest Handicap (H) of all competitors
      let Ho = Math.min(...(Object.values(handicaps) as number[])) / 100;

      let results = findFlights(`${FIXTURES_PATH}/${fixtureName}/`)
        .map(({ callsign, flight }) => {
          let solver = new RacingTaskSolver(task);

          let landed = true;
          for (let fix of flight) {
            if (fix.time > maxT) {
              landed = false;
              break;
            }

            solver.update(fix);
          }

          let result = solver.result;
          let { completed } = result;
          let startTimestamp = result.path[0].time;

          // Competitor’s Marking Distance [km]
          let D = (result.distance || 0) / 1000;

          // Competitor’s Handicap, if handicapping is being used; otherwise H=1
          let H = (handicaps[callsign.toUpperCase()] || 100) / 100;

          // Competitor’s Handicapped Distance. (Dh = D x Ho / H) [km]
          let Dh = D * (Ho / H);

          // Finisher’s Marking Time [s]
          let T = result.time;

          // Finisher’s Marking Speed. (V = D / T)
          let V = completed ? D / (T / 3600) : 0;

          // Finisher’s Handicapped Speed. (Vh = D / T x Ho / H)
          let Vh = V * (Ho / H);

          return { callsign, landed, completed, D, H, Dh, T, V, Vh, startTimestamp };
        });

      // Task Distance [km]
      // let Dt = task.distance / 1000;

      // Minimum Task Time [s]
      // let Td = task.options.aatMinTime || 0;

      // Minimum Handicapped Distance to validate the Day [km]
      let Dm = 100;

      // Highest Handicapped Distance (Dh) of the Day
      let Do = Math.max(...results.map(it => it.Dh));

      // Highest finisher’s Handicapped Speed (Vh) of the Day
      let Vo = Math.max(...results.map(it => it.Vh));

      // Number of competitors who achieve a Handicapped Distance (Dh) of at least Dm
      let n1 = results.filter(it => it.Dh >= Dm).length;

      // Number of finishers exceeding 2/3 of best Handicapped Speed (Vo)
      let n2 = results.filter(it => it.Vh > Vo * (2 / 3)).length;

      // Number of finishers, regardless of speed
      // let n3 = results.filter(it => it.result.completed).length;

      // Number of competitors who achieve a Handicapped Distance (Dh) of at least Dm/2
      // let n4 = results.filter(it => it.Dh > Dm / 2).length;

      // Number of competitors having had a competition launch that Day
      let N = results.length;

      // Marking Time (T) of the finisher whose Vh = Vo; In case of a tie, lowest T applies
      let To = Math.min(...results.filter(it => it.Vh === Vo).map(it => it.T));

      // Maximum available Score for the Day, before F and FCR are applied
      let Pm = Math.min(1000, 5 * Do - 250, 400 * To - 200);

      // Day Factor
      let F = Math.min(1, 1.25 * n1 / N);

      // Completion Ratio Factor
      let FCR = Math.min(1, 1.2 * (n2 / n1) + 0.6);

      // Maximum available Speed Points for the Day, before F and FCR are applied
      let Pvm = (2 / 3) * (n2 / N) * Pm;

      // Maximum available Distance Points for the Day, before F and FCR are applied
      let Pdm = Pm - Pvm;

      let lines = results
        .map(result => {
          // Finisher’s Speed points
          let Pv = result.completed && (result.Vh >= (2 / 3) * Vo)
            ? Pvm * (result.Vh - (2 / 3) * Vo) / ((1 / 3) * Vo)
            : 0;

          // Competitor’s Distance Points
          let Pd = result.completed
            ? Pdm
            : Pdm * (result.Dh / Do);

          // Competitor’s Score for the Day expressed in points
          let S = F * FCR * (Pv + Pd);

          return {...result, Pv, Pd, S};
        })
        .sort((a, b) => b.S - a.S)
        .map((result: any, i) => {
          let distance = result.D ? `${result.D.toFixed(1)} km` : '';
          let speed = result.V ? `${(result.V).toFixed(2)} km/h` : '';

          return [
            `${result.landed || result.completed ? ' ' : '!'} ${(i + 1).toString().padStart(2)}`,
            result.callsign.padEnd(3),
            result.H.toFixed(3).padStart(5),
            formatTime(result.startTimestamp),
            result.T ? formatDuration(result.T) : '        ',
            distance.padStart(8),
            speed.padStart(11),
            Math.round(result.S).toString().padStart(4),
          ].join('\t  ');
        })
        .join('\n');

      expect(`\n${lines}\n`).toMatchSnapshot();
    });
  }

  describe('with task "2017-07-17-lev.tsk"', () => {
    let task: Task;
    let solver: RacingTaskSolver;

    beforeEach(() => {
      task = readTask(`${FIXTURES_PATH}/2017-07-17-lev.tsk`);
      solver = new RacingTaskSolver(task);
    });

    it('returns a result', () => {
      let flight = readFlight(`${FIXTURES_PATH}/2017-07-17-lev/IGP_77hg7sd1.IGC`);
      solver.consume(flight);
      expect(solver.result).toMatchSnapshot();
    });

    it('returns an intermediate result', () => {
      let flight = readFlight(`${FIXTURES_PATH}/2017-07-17-lev/IGP_77hg7sd1.IGC`);
      let part1 = flight.slice(0, 1500);
      let part2 = flight.slice(1500);
      solver.consume(part1);
      expect(solver.result).toMatchSnapshot();
      solver.consume(part2);
      expect(solver.result).toMatchSnapshot();
    });

    it('can handle outlandings', () => {
      let flight = readFlight(`${FIXTURES_PATH}/2017-07-17-lev/ZG_77hv6ci1.igc`);
      solver.consume(flight);
      expect(solver.result).toMatchSnapshot();
    });
  });
});

function findFlights(folderPath: string) {
  return fs.readdirSync(folderPath)
    .filter(filename => (/\.igc$/i).test(filename))
    .filter(filename => filename.match(/^(.{1,3})_/))
    .map(filename => {
      let callsign = filename.match(/^(.{1,3})_/)![1];
      let flight = readFlight(`${folderPath}/${filename}`);
      return { filename, callsign, flight };
    });
}

function readCSV(path: string) {
  let lines = fs.readFileSync(path, 'utf8').split('\n');
  lines.shift();

  let handicaps = Object.create(null);
  lines.map(line => line.trim().split(',')).forEach(([id, _, cn, type, handicap]) => {
    if (id) {
      handicaps[cn] = parseInt(handicap, 10);
    }
  });
  return handicaps;
}
