/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* Asteri subjects record transformer for the Melinda record batch import system
*
* Copyright (C) 2019-2020 University Of Helsinki (The National Library Of Finland)
*
* This file is part of melinda-record-import-transformer-asteri-subjects
*
* melinda-record-import-transformer-asteri-subjects program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* melinda-record-import-transformer-asteri-subjects is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*
* @licend  The above is the entire license notice
* for the JavaScript code in this file.
*
*/

import validateFactory from '@natlibfi/marc-record-validate';
import {
  FieldExclusion as fieldExclusion
} from '@natlibfi/marc-record-validators-melinda';

export default async () => {
  const validate = validateFactory([
    await fieldExclusion([
      {
        tag: /^003$/u
      }
    ]),

  ]);

  return async (record, fix, validateFixes) => {
    const opts = fix ? {fix, validateFixes} : /* istanbul ignore next: The actual functionality is tested with the first condition */ {fix};
    const result = await validate(record, opts);

    return {
      record: result.record,
      failed: result.valid === false,
      messages: result.report
    };
  };
};
