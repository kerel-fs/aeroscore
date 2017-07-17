import * as fs from "fs";

import {read} from "../../src/xcsoar/task-reader";

describe('XCSoar - TaskReader - read()', () => {
  it('reads "2017-07-15-lev" task correctly', () => {
    let xml = fs.readFileSync(`${__dirname}/../../fixtures/2017-07-15-lev/task.tsk`, 'utf8');
    expect(read(xml)).toMatchSnapshot();
  })
});
