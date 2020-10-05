
function removeFields(record, tag) {
    // Starting from the beginning + splice() is a bad idea, so start from the end.
    for ( let i=record.fields.length-1; i >= 0; i-- ) {
        if ( record.fields[i].tag == tag ) {
            // console.info("Remove "+tag+": '"+field2string(record.fields[i]));
            record.fields.splice(i, 1);
        }
    }
    return record;
}

function field2string(field) {
    if ( !field.subfields ) {
        return field.value;
    }
    let str = '' + field.ind1 + field.ind2;
    for ( let i=0; i <field.subfields.length; i++ ) {
        let sf = field.subfields[i];
        str += " ‡" + sf.code + ' ' + sf.value;
    }
    return str;
}

function valid_lexicon_or_onthology(name) {
    if ( !name ) {
        return false;
    }
    // Accepted 040$f values:
    if ( name === 'yso/fin' || name === 'yso/swe' || name === 'slm/fin' || name == 'slm/swe' ) {
        return true;
    }
    return false;
}


function fieldHasSubfield(field, sf_code, sf_value) {
    for ( let curr_subfield of field.subfields ) {
        if ( curr_subfield.code === sf_code ) {
            if ( sf_value == null || curr_subfield.value === sf_value ) {
                return true;
            }
        }
    }
    return false;
}

function getUriFrom024(record) {
    for ( let curr_field of record.fields ) {
        if ( curr_field.tag == '024' && curr_field.ind1 == '7' && curr_field.ind2 == ' '  ) {
            if ( fieldHasSubfield(curr_field, '2', 'uri') ) {
                for ( let curr_subfield of curr_field.subfields ) {
                    if ( curr_subfield.code === 'a' ) { // return 1st suitable 024$a
                        return curr_subfield.value;
                    }
                }          
            }   
        }
    }
    return null;
}


function fieldGetValueOfFirstInstanceOfSubfield(curr_field, tag, ind1, ind2, subfield_code) {
    // if tag/indicator value is optional, use null as value
    if ( tag != null && curr_field.tag != tag ) { return null; }
    if ( ind1 != null && curr_field.ind1 != ind1 ) { return null; }
    if ( ind2 != null && curr_field.ind2 != ind2 ) { return null; }

    for ( let j=0; j < curr_field.subfields.length; j++ ) {
        if ( curr_field.subfields[j].code == subfield_code ) {
            return curr_field.subfields[j].value;
        }
    }
    return null;
}

function recordGetValueOfFirstInstanceOfSubfield(record, tag, ind1, ind2, subfield_code) {
    for ( let i=0; i < record.fields.length-1; i++ ) {
        let curr_field = record.fields[i];
        let val = fieldGetValueOfFirstInstanceOfSubfield(curr_field, tag, ind1, ind2, subfield_code);
        if ( val != null ) {
            return val;
        }
    }
    return null;      
}

function determineSplicePosition(field, new_code) {
    
    for ( let i=0; i < field.subfields.length; i++ ) {
        let curr_code = field.subfields[i].code;
        switch ( new_code ) {
            case '2' : // $2 precedes $0 
                if ( curr_code == '0' ) { return i; }
            case '0' :
                if ( curr_code == '5' || curr_code == '9' ) { return i; }
        }
    }
    return field.subfields.length; // add to end if nothing matches 
}

function updateField(curr_field, ontholex, uri) {
    let j = Math.floor(curr_field.tag / 100);
    if ( j === 1 || j === 4 || j === 5 ) {     
        if ( ontholex ) {
            let has2 = fieldGetValueOfFirstInstanceOfSubfield(curr_field, null, null, '2'); 
            if ( has2 ) {
                console.warn("Field already has subfield ‡2. Skipping field"+field2string(curr_field));
            }
            else {
                let position = determineSplicePosition(curr_field, '2');
                curr_field.subfields.splice(position, 0, {'code' : '2', 'value' : ontholex})
            }
        }
        if ( uri && j === 1 ) {
            let has0 = fieldGetValueOfFirstInstanceOfSubfield(curr_field, null, null, '0');
            if ( has0 ) {
                console.warn("sf 0 already exists.");
            }   
            else {
                let position = determineSplicePosition(curr_field, '0');
                curr_field.subfields.splice(position, 0, {'code' : '0', 'value' : uri})
            }
        }
    }
    return curr_field;
}

function local_tests() {
    let tags = [ '100', '200', '410' ];
    let fields = [ { ind1: '1', ind2: '2', subfields: [ { code: 'a', value: 'foo'}, {code: 'b', value: 'bar'}]},
                   { ind1: '2', ind2: '1', subfields: [ { code: 'a', value: "Doe, John."}, { code : '9', value: 'FENNI<KEEP>'}]},

];

    for ( let j=0; j < fields.length; j++ ) {
        for ( let i=0; i < tags.length; i++ ) {        
            let curr_field = JSON.parse(JSON.stringify(fields[j])); // clone it
            curr_field.tag = tags[i];
            console.info("\nTEST " + (j+1) + "." + (i+1) + " (" + curr_field.tag + ", uri, lex)");
            console.info(curr_field.tag+" '"+field2string(curr_field)+"' =>");
            curr_field = updateField(curr_field, 'yso/fake', 'uri');
            console.info(curr_field.tag+" '"+field2string(curr_field)+"'");
        }
    }

}


export function melkehitys1653(record) {
//export default ({}) => ({input_record: record}) => {
    // local_tests();

    if ( record.leader.charAt(6) != 'z' ) {
        console.error("Error: not an authority record. No fixes applied!");
        return record;
    }

    record = removeFields(record, '003');

    let ontholex = recordGetValueOfFirstInstanceOfSubfield(record, '040', null, null, 'f');

    if ( !valid_lexicon_or_onthology(ontholex) ) {
        console.warn(ontholext === null ? "No 040\$f found" : "Unsupported 040\$f '"+ontholex+"'");
        ontholex = null;
    }

    
    let uri = getUriFrom024(record);

    if ( !uri ) { 
        console.warn("No URI found!");
        //return record;
    }

    if ( uri == null && ontholex == null ) {
        console.warn("Nothing to do as both URI and LEX are null");
        return record;
    }
    
    // console.info("Got uri '"+uri+"'");

    for ( let i=0; i < record.fields.length; i++ ) {
        record.fields[i] = updateField(record.fields[i], ontholex, uri);
    }

    /*
    console.info("END");
    console.log(record);
    for ( let f of record.fields ) {
        console.log(f.tag + ": " + field2string(f));
    }
    */
    
    return record;
}
