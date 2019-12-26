
mod utils;

#[macro_use]
extern crate serde_derive;

use wasm_bindgen::prelude::*;
use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::{JsCast, JsValue};
use web_sys::{WebGlProgram, WebGlRenderingContext, WebGlShader, WebGlUniformLocation, console};

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
    alert("Hello, wasm-vis!");
}

fn window() -> web_sys::Window {
    web_sys::window().expect("no global `window` exists")
}

fn request_animation_frame(f: &Closure<dyn FnMut()>) {
    window()
        .request_animation_frame(f.as_ref().unchecked_ref())
        .expect("should register `requestAnimationFrame` OK");
}

fn document() -> web_sys::Document {
    window()
        .document()
        .expect("should have a document on window")
}

fn body() -> web_sys::HtmlElement {
    document().body().expect("document should have a body")
}

fn perf_now() -> f64 {
    window()
        .performance()
        .expect("window should have perfomance obj")
        .now()
}

const BUF_MAX_SZ : usize = 4000*2;
static mut BUF : [f32; BUF_MAX_SZ] = [0f32;BUF_MAX_SZ];
static mut BUF_SZ : usize = 0;
static mut BUF_RD : usize = 0;
static mut BUF_I : usize  = 0;


struct CBuf {
    buf : [f32; BUF_MAX_SZ],
    sz  : usize,
    cursor : usize,
}

impl CBuf {
    fn add_point_perf(&mut self, pos : f32, sample : f32) {
        use core::ptr::copy;
        unsafe { copy(&self.buf as *const f32, ((&mut self.buf[0]) as *mut f32).offset(2), self.sz - 2) }
        
        //for i in 2 .. self.sz {
        //    self.buf[i] = self.buf[i-2];
        //}

        self.buf[0] = pos;
        self.buf[1] = sample;
    }
}

static mut PERF_BUF : CBuf = CBuf {
    buf : [0f32;BUF_MAX_SZ],
    sz  : 0,
    cursor : 0,
};

fn get_perf_buf() -> &'static mut CBuf {
    unsafe {&mut PERF_BUF}
}

static mut LAST_TIMING : f64 = 0f64;
fn get_last_timing() -> &'static mut f64 {
    unsafe { &mut LAST_TIMING }
}

fn set_last_timing(t : f64) {
    unsafe { LAST_TIMING = t; }
}


fn add_point(amp : f32) {
    unsafe {
        BUF[BUF_RD + 0] = BUF_I as f32;
        BUF[BUF_RD + 1] = amp;
        BUF_RD += 2;
        BUF_RD %= BUF_SZ;
        BUF_I += 1;
        BUF_I %= BUF_SZ / 2;
    }
}

fn move_plot(offset : isize) {
    unsafe {
        let mut j = 0;
        for i in (0 .. BUF_SZ).step_by(2) {
            BUF[i]   = j as f32;
            BUF[i+1] = (i as f32 / 10. + (offset as f32)/2.).sin() * 50.0;
            j += 2;
        }
    }
}


fn gen_pack_unpack_8(delta : &[i32;8]) -> usize {
    use core::mem::transmute_copy;
    use delta::OutEnc;
    use delta::ch8::decode_8;
    use delta::ch8::encode_8;
    use delta::common::*;

    let mut bits_cnt= 0;
    for i in 0 .. delta.len() {
        let tmp = sample_size(delta[i]);
        if  tmp > bits_cnt {
            bits_cnt = tmp;
        }
    }
    assert_ne!(bits_cnt, 0);

    let mut out : OutEnc = [0;6];
    let code = 0x0;

    let sz = encode_8(&delta, bits_cnt as u8, code, &mut out);
    let input : [u128;2] = unsafe { transmute_copy(&out) };

    let mut decoded_delta = [0i32;8];
    decode_8(&input, &mut decoded_delta).unwrap();

    log::info!("packed with p{} : {:x?}", bits_cnt, &out[..]);
    log::info!("in : {:x?}, out : {:x?}\n", &delta[..], &decoded_delta[..]);

    assert_eq!(delta, &decoded_delta);

    sz
}


#[wasm_bindgen(start)]
pub fn run() -> Result<(), JsValue> {
    // Set panic output to js console
    console_error_panic_hook::set_once();
    // Setup logger
    wasm_logger::init(wasm_logger::Config::default());
    
    
    let delta = [3333i32; 8];
    gen_pack_unpack_8(&delta);

    let test = JsValue::from_str("MY js value");
    log::info!("Some info {:?}", &test);
    log::error!("Error message");

    let document = web_sys::window().unwrap().document().unwrap();
    let canvas = document.get_element_by_id("canvas").unwrap();
    let canvas: web_sys::HtmlCanvasElement = canvas.dyn_into::<web_sys::HtmlCanvasElement>()?;

    let height = canvas.offset_height() as u32;
    let width = canvas.offset_width() as u32;
    canvas.set_height(height);
    canvas.set_width(width);
    assert!(width <= BUF_MAX_SZ as u32 / 2);

    // Set buffer actual size
    unsafe { BUF_SZ = width as usize; }
    unsafe { PERF_BUF.sz = (width * 2)as usize; }

    // Context settings
    #[derive(Serialize)]
    struct CxtCfg {
        antialias : bool,
        depth     : bool,
    };

    let cxt_cfg = CxtCfg { antialias : false, depth : false };
    let cxt_cfg = JsValue::from_serde(&cxt_cfg).unwrap();

    let context = canvas
        //.get_context("webgl")?
        .get_context_with_context_options("webgl", &cxt_cfg)?
        .unwrap()
        .dyn_into::<WebGlRenderingContext>()?;
        

    // Shaders
    let vert_shader = compile_shader(
        &context,
        WebGlRenderingContext::VERTEX_SHADER,
        r#"
        attribute vec2 a_position;
        uniform vec2 u_resolution;
        uniform vec2 u_shift;
        uniform vec2 u_xmod;

        // all shaders have a main function
        void main() 
        {
          vec2 Pos = a_position + u_shift; 
          
          //if(u_xmod.x != 0.0 )
          //{
          //  Pos.x = mod(Pos.x,u_xmod.x);
          //};
          //

          //Pos.x = mod(Pos.x, u_resolution.x);

          Pos.x = abs(Pos.x);

          vec2 zeroToOne = Pos / u_resolution; // преобразуем положение в пикселях к диапазону от 0.0 до 1.0
       
          // преобразуем из 0->1 в 0->2
          vec2 zeroToTwo = zeroToOne * 2.0;
          // преобразуем из 0->2 в -1->+1 (пространство отсечения)
          vec2 clipSpace = zeroToTwo - 1.0;
          vec2 clipSpaceN = clipSpace * vec2(1, -1); // переворачиваем систему коооординат (0,0) в левом верхнем углу
     
          gl_Position = vec4(clipSpaceN, 0, 1);  
        }
    "#,
    )?;
    let frag_shader = compile_shader(
        &context,
        WebGlRenderingContext::FRAGMENT_SHADER,
        r#"
        void main() {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        }
    "#,
    )?;
    let program = link_program(&context, &vert_shader, &frag_shader)?;
    context.use_program(Some(&program));

    //ATR
    //
    let position_attribute_location = context.get_attrib_location(&program, "a_position");
    let resolution_uniform_location = context.get_uniform_location(&program, "u_resolution");
    //context.get_uniform_location(&program, "u_color");
    let shift_location = context.get_uniform_location(&program, "u_shift");
    let xmod_location = context.get_uniform_location(&program, "u_xmod");

    let position_buffer = context.create_buffer().ok_or("failed to create buffer")?;
    context.bind_buffer(WebGlRenderingContext::ARRAY_BUFFER, Some(&position_buffer));

    context.enable_vertex_attrib_array(position_attribute_location as u32);
    context.vertex_attrib_pointer_with_i32(0, 2, WebGlRenderingContext::FLOAT, false, 0, 0);
    context.uniform2f(resolution_uniform_location.as_ref(), width as f32, height as f32);
    context.viewport(0,0, width as i32, height as i32);

    let f = Rc::new(RefCell::new(None));
    let g = f.clone();
    let mut cnt = 0;

    *g.borrow_mut() = Some(Closure::wrap(Box::new(move || {

        //move_plot(cnt);
        cnt += 1;
        let t1 = get_last_timing();
        let t2 = perf_now();
        let dt = t2 - *t1;
        let x = t2 / 16.66667;
        set_last_timing(t2);
        
        let offset = 1;
        //let y = (x as f32 / 10. + (offset as f32)/2.).sin() * 50.0;
        let y = dt as f32;
        get_perf_buf().add_point_perf(x as f32, y);

        //log::info!("frame : {} ms, pos: {}", dt, x);
        //log::info!("buf sz : {:?}", &get_perf_buf().buf[.. get_perf_buf().sz]);

        context.clear_color(1.0, 1.0, 1.0, 1.0);
        context.clear(WebGlRenderingContext::COLOR_BUFFER_BIT);

        draw_perf(&context, &xmod_location, &shift_location, -x as f32, 100.);
        draw_perf(&context, &xmod_location, &shift_location, -x as f32, 200.);
        draw_perf(&context, &xmod_location, &shift_location, -x as f32, 300.);
        draw_perf(&context, &xmod_location, &shift_location, -x as f32, 400.);
        draw_perf(&context, &xmod_location, &shift_location, -x as f32, 500.);
        draw_perf(&context, &xmod_location, &shift_location, -x as f32, 600.);
        draw_perf(&context, &xmod_location, &shift_location, -x as f32, 700.);
        draw_perf(&context, &xmod_location, &shift_location, -x as f32, 800.);
        draw_perf(&context, &xmod_location, &shift_location, -x as f32, 900.);
        
        //draw_plot(&context, &xmod_location, &shift_location, 100.);
        //draw_plot(&context, &xmod_location, &shift_location, 200.);
        //draw_plot(&context, &xmod_location, &shift_location, 300.);
        //draw_plot(&context, &xmod_location, &shift_location, 400.);
        //draw_plot(&context, &xmod_location, &shift_location, 500.);
        //draw_plot(&context, &xmod_location, &shift_location, 600.);
        //draw_plot(&context, &xmod_location, &shift_location, 700.);
        //draw_plot(&context, &xmod_location, &shift_location, 800.);
        //draw_plot(&context, &xmod_location, &shift_location, 900.);

        //context.finish();

        request_animation_frame(f.borrow().as_ref().unwrap());
    }) as Box<dyn FnMut()>));
    
    set_last_timing(perf_now());
    request_animation_frame(g.borrow().as_ref().unwrap());

    Ok(())
}

pub fn draw_perf(
    context : &WebGlRenderingContext, 
    xmod_location : &Option<WebGlUniformLocation>, 
    shift_location : &Option<WebGlUniformLocation>,
    shift_h : f32,
    shift_v : f32,
    ) {

    unsafe {
        let vert_array = js_sys::Float32Array::view(&PERF_BUF.buf[.. PERF_BUF.sz]);

        context.buffer_data_with_array_buffer_view(
            WebGlRenderingContext::ARRAY_BUFFER,
            &vert_array,
            WebGlRenderingContext::STREAM_DRAW,
        );
    }

    context.uniform2f(xmod_location.as_ref(), 0f32, 0f32);
    context.uniform2f(shift_location.as_ref(), shift_h, shift_v);
    context.draw_arrays(
        WebGlRenderingContext::LINE_STRIP,
        0,
        unsafe{PERF_BUF.sz as i32 / 2},
    );
}

pub fn draw_plot(
    context : &WebGlRenderingContext, 
    xmod_location : &Option<WebGlUniformLocation>, 
    shift_location : &Option<WebGlUniformLocation>,
    shift_v : f32,
    ) {

    unsafe {
        let vert_array = js_sys::Float32Array::view(&BUF[.. BUF_SZ]);

        context.buffer_data_with_array_buffer_view(
            WebGlRenderingContext::ARRAY_BUFFER,
            &vert_array,
            WebGlRenderingContext::STREAM_DRAW,
        );
    }

    context.uniform2f(xmod_location.as_ref(), 0f32, 0f32);
    context.uniform2f(shift_location.as_ref(), 0f32, shift_v);
    context.draw_arrays(
        WebGlRenderingContext::LINE_STRIP,
        0,
        unsafe{BUF_SZ as i32 / 2},
    );
}

pub fn compile_shader(
    context: &WebGlRenderingContext,
    shader_type: u32,
    source: &str,
) -> Result<WebGlShader, String> {
    let shader = context
        .create_shader(shader_type)
        .ok_or_else(|| String::from("Unable to create shader object"))?;
    context.shader_source(&shader, source);
    context.compile_shader(&shader);

    if context
        .get_shader_parameter(&shader, WebGlRenderingContext::COMPILE_STATUS)
        .as_bool()
        .unwrap_or(false)
    {
        Ok(shader)
    } else {
        Err(context
            .get_shader_info_log(&shader)
            .unwrap_or_else(|| String::from("Unknown error creating shader")))
    }
}

pub fn link_program(
    context: &WebGlRenderingContext,
    vert_shader: &WebGlShader,
    frag_shader: &WebGlShader,
) -> Result<WebGlProgram, String> {
    let program = context
        .create_program()
        .ok_or_else(|| String::from("Unable to create shader object"))?;

    context.attach_shader(&program, vert_shader);
    context.attach_shader(&program, frag_shader);
    context.link_program(&program);

    if context
        .get_program_parameter(&program, WebGlRenderingContext::LINK_STATUS)
        .as_bool()
        .unwrap_or(false)
    {
        Ok(program)
    } else {
        Err(context
            .get_program_info_log(&program)
            .unwrap_or_else(|| String::from("Unknown error creating program object")))
    }
}
