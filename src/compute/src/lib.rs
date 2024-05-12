use std::str::FromStr;

use num::BigUint;
use wasm_bindgen::prelude::*;
use wasm_bindgen::Clamped;
use web_sys::{CanvasRenderingContext2d, ImageData};

#[wasm_bindgen]
pub fn draw(
    ctx: &CanvasRenderingContext2d,
    width: u32,
    height: u32,
    start_x_str: &str,
    start_y_str: &str,
) -> Result<(), JsValue> {
    web_sys::console::log_1(&"Starting calculation".into());
    let smol_x = start_x_str.parse::<u64>();
    let smol_y = start_y_str.parse::<u64>();

    let data = if let (Ok(start_x), Ok(start_y)) = (smol_x, smol_y) {
        smolboy::draw_field(start_x, start_y, width, height)
    } else {
        let big_x = BigUint::from_str(start_x_str);
        let big_y = BigUint::from_str(start_y_str);
        if let (Ok(big_x), Ok(big_y)) = (big_x, big_y) {
            bigboy::draw_field(&big_x, &big_y, width, height)
        } else {
            return Err("Could not draw with that number".into());
        }
    };
    web_sys::console::log_1(&"Finished calculation".into());

    let image_data = ImageData::new_with_u8_clamped_array_and_sh(Clamped(&data), width, height)?;
    web_sys::console::log_1(&"Saved image data".into());

    let result = ctx.put_image_data(&image_data, 0.0, 0.0);
    web_sys::console::log_1(&"Put image data".into());
    result
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct Rgb {
    r: u8,
    g: u8,
    b: u8,
}
mod smolboy {
    use num::Integer;

    use crate::Rgb;

    fn gcd_cell(a: u64, b: u64) -> Rgb {
        if a.gcd(&b) == 1 {
            Rgb { r: 0, g: 0, b: 0 }
        } else {
            Rgb {
                r: 255,
                g: 255,
                b: 255,
            }
        }
    }

    pub(crate) fn draw_field(start_x: u64, start_y: u64, width: u32, height: u32) -> Vec<u8> {
        let mut result = Vec::with_capacity(4 * (width as usize) * (height as usize));
        for y_offset in 0..height {
            let y = start_y + u64::from(y_offset);
            for x_offset in 0..width {
                let x = start_x + u64::from(x_offset);
                let cell = gcd_cell(x, y);
                result.push(cell.r);
                result.push(cell.g);
                result.push(cell.b);
                result.push(255);
            }
        }
        result
    }
}
mod bigboy {
    use num::{BigUint, FromPrimitive, Integer};

    use crate::Rgb;

    fn gcd_cell(a: &BigUint, b: &BigUint) -> Rgb {
        if a.gcd(b) == BigUint::from_i32(1).unwrap() {
            Rgb { r: 0, g: 0, b: 0 }
        } else {
            Rgb {
                r: 255,
                g: 255,
                b: 255,
            }
        }
    }

    pub(crate) fn draw_field(
        start_x: &BigUint,
        start_y: &BigUint,
        width: u32,
        height: u32,
    ) -> Vec<u8> {
        let mut result = Vec::with_capacity(4 * (width as usize) * (height as usize));
        for x_offset in 0..width {
            let x = start_x + x_offset;
            for y_offset in 0..height {
                let y = start_y + y_offset;
                let cell = gcd_cell(&x, &y);
                result.push(cell.r);
                result.push(cell.g);
                result.push(cell.b);
                result.push(255);
            }
        }
        result
    }
}
