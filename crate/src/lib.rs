extern crate js_sys;
extern crate serde_json;
extern crate zip;

use chrono::{Datelike, Timelike};
use js_sys::{Function, Uint8Array};
use serde_wasm_bindgen::from_value;
use std::io::{Cursor, Read, Seek, SeekFrom, Write};
use wasm_bindgen::prelude::*;
use zip::{write, CompressionMethod, DateTime, ZipWriter};

#[wasm_bindgen]
pub fn hello_world() {

}

#[wasm_bindgen]
pub fn archive(files: Vec<Uint8Array>, file_names: JsValue, callback: Option<Function>) -> Vec<u8> {
    let mut archive = Cursor::new(Vec::new());
    let mut zip = ZipWriter::new(&mut archive);
    let options = write::FileOptions::default().compression_method(CompressionMethod::Stored);
    let file_names: Vec<String> = from_value(file_names).unwrap();
    for (index, file) in files.iter().enumerate() {
        let data = file.to_vec();
        let now_utc = chrono::Local::now();
        let now = DateTime::from_date_and_time(
            now_utc.year() as u16,
            now_utc.month() as u8,
            now_utc.day() as u8,
            now_utc.hour() as u8,
            now_utc.minute() as u8,
            now_utc.second() as u8,
        )
        .unwrap();
        let file_name = file_names[index].clone();

        zip.start_file(file_name, options.last_modified_time(now))
            .unwrap();
        let file = &data[..];
        zip.write(file).unwrap();
        match callback {
            Some(ref f) => {
                let this = JsValue::null();
                let _ = f.call1(&this, &JsValue::from(format!("{}", index)));
            }
            None => (),
        };
    }
    let zipped_files = zip.finish().unwrap();
    zipped_files.seek(SeekFrom::Start(0)).unwrap();
    let mut output = Vec::new();
    zipped_files.read_to_end(&mut output).unwrap();
    output
}
