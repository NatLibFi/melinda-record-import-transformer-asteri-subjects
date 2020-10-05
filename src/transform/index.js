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

import {MarcRecord} from '@natlibfi/marc-record';
import {EventEmitter} from 'events';
import createStreamParser, {toXml, ALWAYS as streamParserAlways} from 'xml-flow';
import {Parser} from 'xml2js';
//import createConverter from './convert';
import { melkehitys1653 as createConverter } from './convert';
import createValidator from './validate';
import NotSupportedError from './../error'; // Added 23.6.2020
import {MARCXML} from '@natlibfi/marc-record-serializers';

export default options => (stream, {validate = true, fix = true} = {}) => {
  MarcRecord.setValidationOptions({subfieldValues: false});

  const emitter = new class extends EventEmitter {}();

  start();

  return emitter;

  async function start() {
    let converterPromise; // eslint-disable-line functional/no-let
    const promises = [];

    const validateRecord = await createValidator();

    const reader = new MARCXML.Reader(stream)
        .on('end', async () => {
            try {
              await Promise.all(promises);
              emitter.emit('end', promises.length);
            } catch (err) {
              /* istanbul ignore next: Generic error */ emitter.emit('error', err);
            }
        })
        .on('data', input_record => {
            try {
                promises.push(convert()); // eslint-disable-line functional/immutable-data
            } catch (err) {
                /* istanbul ignore next: Generic error */ emitter.emit('error', err);
            }
      
            async function convert() {
                try {
                  const obj = input_record;
                  const convertRecord = converterPromise;
                  const record = createConverter(input_record);

                  if (validate === true || fix === true) {
                    const result = await validateRecord(record, fix);      
                    emitter.emit('record', result);
                    return;
                  }
      
                  /* istanbul ignore next: No tests without validators */ emitter.emit('record', {record});
                } catch (err) {
      
                  if (err instanceof NotSupportedError) {
      
                    return emitter.emit('record', {
                      failed: true,
                      messages: [err.message]
                    });
                  }
      
                  throw err;
      
                }
            }
        });       
    }
}
