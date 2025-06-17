---
title: "Principles of Electronic Communication (4331104) - Winter 2024 Solution"
date: 2024-12-09
description: "Solution guide for Principles of Electronic Communication (4331104) Winter 2024 exam"
summary: "Detailed solutions and explanations for the Winter 2024 exam of Principles of Electronic Communication (4331104)"
tags: ["study-material", "solutions", "communication", "4331104", "2024", "winter"]
---

## Question 1(a) [3 marks]

**What is modulation? What is the need of it?**

**Answer**:
Modulation is the process of varying one or more properties (amplitude, frequency, or phase) of a high-frequency carrier signal according to the instantaneous value of a lower frequency message signal.

**Need for modulation:**

- **Antenna size reduction**: Allows practical antenna size (λ/4)
- **Multiplexing**: Enables multiple signals to share same medium
- **Interference reduction**: Shifts signal to suitable frequency band
- **Range extension**: Increases transmission distance

**Mnemonic:** "AMIR" - Antenna, Multiplexing, Interference, Range

## Question 1(b) [4 marks]

**Derive the expression for DSBFC of AM wave.**

**Answer**:
DSBFC (Double Sideband Full Carrier) AM wave derivation:

**Mathematical derivation:**

- Carrier signal: c(t) = Ac cos(ωct)
- Message signal: m(t) = Am cos(ωmt)
- AM signal: s(t) = Ac[1 + μm(t)]cos(ωct)
- Where μ = modulation index = Am/Ac

**Substituting message signal:**
s(t) = Ac[1 + μ cos(ωmt)]cos(ωct)
s(t) = Ac cos(ωct) + μAc cos(ωmt)cos(ωct)

**Using trigonometric identity:**
cos(A)cos(B) = 1/2[cos(A+B) + cos(A-B)]

**Final expression:**
s(t) = Ac cos(ωct) + (μAc/2)[cos((ωc+ωm)t) + cos((ωc-ωm)t)]

**Diagram:**

```goat
    ^
    |    Carrier
Ac  |    /|\
    |   / | \
    |  /  |  \
    | /   |   \
    |/    |    \
    +-----+-----+----> f
         fc
```

```goat
    ^
    |                LSB   Carrier   USB
    |                 |      |       |
Pam |                 |      |       |
    |                 |      |       |
    |                 |      |       |
    |                /|\    /|\     /|\
    +---------------+-+-----+------+-+----> f
                 fc-fm     fc    fc+fm
```

## Question 1(c) [7 marks]

**Classify Noise signal and explain flicker noise, shot noise and thermal noise.**

**Answer**:

**Noise Classification:**

| Type | Source | Characteristics |
|------|--------|-----------------|
| **External Noise** | Environmental sources | Outside communication system |
| **Internal Noise** | Components | Generated within system |

**Types of internal noise:**

1. **Flicker Noise:**
   - **Source**: Occurs in active devices
   - **Characteristics**: Inversely proportional to frequency (1/f)
   - **Effect**: Dominant at low frequencies

2. **Shot Noise:**
   - **Source**: Random electron flow across junctions
   - **Characteristics**: Independent of frequency (white noise)
   - **Effect**: Random current fluctuations in diodes/transistors

3. **Thermal Noise:**
   - **Source**: Random motion of electrons due to temperature
   - **Characteristics**: Present in all conductors, resistors
   - **Formula**: Pn = kTB (k=Boltzmann constant, T=temperature, B=bandwidth)
   - **Effect**: Sets noise floor in receivers

**Mnemonic:** "FST" - Flicker decreases with Frequency, Shot is from electron flow, Thermal depends on Temperature

## Question 1(c) OR [7 marks]

**Describe EM wave also write at least one application of different band of spectrum.**

**Answer**:

**EM Wave:**
Electromagnetic waves are energy propagating through space as time-varying electric and magnetic fields, traveling at speed of light (3×10⁸ m/s).

**Characteristics:**

- Transverse waves with E and H fields perpendicular to each other
- No medium required for propagation
- Described by wavelength (λ) and frequency (f)
- Relation: c = f × λ

**EM Spectrum and Applications:**

| Frequency Band | Frequency Range | Application |
|----------------|-----------------|-------------|
| ELF | 3Hz-30Hz | Submarine communication |
| VLF | 3kHz-30kHz | Navigation systems |
| LF | 30kHz-300kHz | AM broadcasting |
| MF | 300kHz-3MHz | AM radio broadcasting |
| HF | 3MHz-30MHz | Shortwave radio |
| VHF | 30MHz-300MHz | FM radio, TV broadcasting |
| UHF | 300MHz-3GHz | TV, mobile phones, WiFi |
| SHF | 3GHz-30GHz | Satellite communication, radar |
| EHF | 30GHz-300GHz | Millimeter wave communication |
| Infrared | 300GHz-400THz | Remote controls, thermal imaging |
| Visible | 400THz-800THz | Fiber optic communication |
| Ultraviolet | 800THz-30PHz | Sterilization, authentication |
| X-Rays | 30PHz-30EHz | Medical imaging |
| Gamma Rays | >30EHz | Cancer treatment |

**Diagram:**

```goat
      +----------------+----------------+----------------+----------------+
      |                |                |                |                |
Radio   Microwave    Infrared       Visible         Ultraviolet     X-ray    Gamma
      |                |                |                |                |
      +----------------+----------------+----------------+----------------+
  Increasing Frequency →
  Decreasing Wavelength →
```

**Mnemonic:** "RMIUXG" - Radio, Microwave, Infrared, Ultraviolet, X-ray, Gamma

## Question 2(a) [3 marks]

**State advantages of SSB over DSB.**

**Answer**:

**Advantages of SSB over DSB:**

| Parameter | SSB Advantage |
|-----------|---------------|
| **Bandwidth** | 50% less bandwidth requirement |
| **Power** | Power saving of 83.33% |
| **Transmitter** | Less power amplification needed |
| **Receiver** | Simpler design without phase distortion |
| **SNR** | Better signal-to-noise ratio |
| **Fading** | Less susceptible to selective fading |

**Mnemonic:** "BP TRFS" - Bandwidth, Power, Transmitter, Receiver, Fading, SNR

## Question 2(b) [4 marks]

**Explain generation of FM wave using FET reactance modulator.**

**Answer**:

**FET Reactance Modulator:**

**Working principle:**

- Uses FET as voltage-controlled reactance
- Changes effective capacitance based on modulating signal
- Connected across LC tank circuit of oscillator

**Circuit operation:**

1. Modulating signal applied to gate of FET
2. FET drain-source resistance varies with gate voltage
3. Capacitive reactance changes with modulating signal
4. Oscillator frequency deviates with input signal

**Diagram:**

```goat
      +-----|>|-----+
      |             |
      |             C
      |             |
    V_in          +---+
      |           |FET|
      +-----R-----|   |
                  +---+
                    |
                   LC
                 Circuit
```

**Key features:**

- **Simple design**: Fewer components than other modulators
- **Linearity**: Good for wide-band FM generation
- **Stability**: Temperature stable compared to varactor diodes

**Mnemonic:** "LOVE FM" - LC Oscillator with Voltage-controlled Element for FM

## Question 2(c) [7 marks]

**Derive the equation for total power in AM, calculate percentage of power savings in DSB and SSB.**

**Answer**:

**Power in AM signal:**

**For AM signal s(t) = Ac[1 + μcos(ωmt)]cos(ωct)**

**Total power calculation:**

1. Power in carrier: Pc = Ac²/2
2. Power in sidebands: Ps = μ²Ac²/4 (total for both sidebands)
3. Total power: Pt = Pc + Ps = Ac²/2 × (1 + μ²/2)

**For 100% modulation (μ=1):**

- Pt = Pc × (1 + 1/2) = 1.5 × Pc
- Carrier power = 66.67% of total
- Sideband power = 33.33% of total

**Power savings:**

1. **In DSB-SC:** 
   - Carrier is suppressed
   - Power saved = 66.67%

2. **In SSB:**
   - Carrier + one sideband suppressed
   - Power saved = 66.67% + 16.67% = 83.33%

**Comparative Table:**

| Modulation | Carrier Power | Sideband Power | Total Power | Power Saving |
|------------|---------------|----------------|-------------|--------------|
| AM (μ=1) | 100% | 50% | 150% | 0% |
| DSB-SC | 0% | 50% | 50% | 66.67% |
| SSB | 0% | 25% | 25% | 83.33% |

**Mnemonic:** "CST" - Carrier power, Sideband power, Total power

## Question 2(a) OR [3 marks]

**Draw and explain Time domain and Frequency domain display of AM wave.**

**Answer**:

**Time Domain and Frequency Domain Display of AM Wave:**

**Time Domain:**

- Shows amplitude variations over time
- Envelope follows modulating signal
- Maximum amplitude: A₁ = Ac(1+μ)
- Minimum amplitude: A₂ = Ac(1-μ)
- Modulation index: μ = (A₁-A₂)/(A₁+A₂)

**Frequency Domain:**

- Shows power distribution across frequencies
- Carrier at center frequency fc
- Upper sideband at fc+fm
- Lower sideband at fc-fm
- Bandwidth = 2fm

**Diagram:**

```goat
Time Domain:                         Frequency Domain:
    ^                                    ^
    |                                    |
A₁  |    /\      /\                      |          Carrier
    |   /  \    /  \                     |             |
Ac  |--/----\--/----\--                  |             |
    |  \    /  \    /                    |   LSB       |       USB
A₂  |   \  /    \  /                     |    |        |        |
    |    \/      \/                      |    |        |        |
    +--------------------------->        +----+---------+--------+------>
        t                                   fc-fm      fc      fc+fm
```

**Mnemonic:** "TEF" - Time domain shows Envelope, Frequency domain shows spectral components

## Question 2(b) OR [4 marks]

**Explain pre-emphasis & de-emphasis circuit.**

**Answer**:

**Pre-emphasis and De-emphasis Circuits:**

**Purpose:**

- Improve SNR for high-frequency components
- Compensate for higher noise in high frequencies
- Used primarily in FM systems

**Pre-emphasis:**

- Applied at transmitter
- Boosts high-frequency components
- Typically +6dB/octave above 2.1kHz
- Circuit: High-pass RC network (resistor in series, capacitor in parallel)

**De-emphasis:**

- Applied at receiver
- Attenuates high-frequency components
- Restores original signal balance
- Circuit: Low-pass RC network (resistor in parallel, capacitor in series)

**Diagrams:**

```goat
Pre-emphasis:                    De-emphasis:
    R                                C
+---www---+---+                 +---||---+---+
|         |   |                 |        |   |
Vin       C   Vout              Vin      R   Vout
|         |   |                 |        |   |
+----------   |                 +---------   |
             ---                            ---
              -                              -
```

**Frequency response:**

```goat
    ^
    |        Pre-emphasis
Gain|          /
    |         /
    |        /
0dB |-------/
    |      /       De-emphasis
    |     /          \
    |    /            \
    +-------------------->
       2.1kHz           f
```

**Mnemonic:** "HIGH-LOW" - HIGHer frequencies boosted at transmitter, LOWered at receiver

## Question 2(c) OR [7 marks]

**Compare narrowband FM and wideband FM.**

**Answer**:

**Comparison of Narrowband FM and Wideband FM:**

| Parameter | Narrowband FM | Wideband FM |
|-----------|---------------|-------------|
| **Modulation Index (β)** | β << 1 (typically <0.5) | β >> 1 (typically >5) |
| **Bandwidth** | 2fm (twice message bandwidth) | 2fm(β+1) (Carson's rule) |
| **Significant Sidebands** | Only first pair of sidebands | Multiple sidebands |
| **Applications** | Mobile communication, two-way radio | FM broadcasting, high-fidelity audio |
| **Signal Quality** | Lower fidelity, less noise immunity | Higher fidelity, better noise immunity |
| **Power Efficiency** | Higher | Lower |
| **Spectrum Utilization** | Efficient | Less efficient |
| **Circuit Complexity** | Simpler | More complex |

**Bandwidth calculation:**

- Narrowband FM: BW = 2fm
- Wideband FM: BW = 2fm(β+1) (Carson's rule)

**Spectrum diagram:**

```goat
Narrowband FM:                    Wideband FM:
    ^                                 ^
    |                                 |
    |            |                    |
    |        |   |   |                |   | | | | | | | | | |
    |    |   |   |   |   |            | | | | | | | | | | | | | |
    +---------------------->          +-------------------------->
       fc-fm  fc  fc+fm                  fc-5fm    fc    fc+5fm
```

**Mnemonic:** "BASPCB" - Bandwidth, Applications, Sidebands, Power, Complexity, Beta

## Question 3(a) [3 marks]

**Define any FOUR characteristics of radio receiver.**

**Answer**:

**Characteristics of Radio Receiver:**

1. **Sensitivity:**
   - Ability to amplify weak signals
   - Measured in microvolts (μV)
   - Typically 1-10μV for good receivers

2. **Selectivity:**
   - Ability to separate desired signal from adjacent channels
   - Determined by bandwidth of IF amplifier
   - Measured in dB at specific frequency offsets

3. **Fidelity:**
   - Accuracy in reproducing original signal
   - Depends on bandwidth and distortion
   - Measured as frequency response flatness

4. **Image Frequency Rejection:**
   - Ability to reject signals at image frequency (fi = fs ± 2fIF)
   - Measured in dB
   - Higher values indicate better performance

**Additional characteristics:**

- Signal-to-noise ratio (SNR)
- Automatic gain control (AGC) range
- Dynamic range

**Mnemonic:** "SFID" - Sensitivity, Fidelity, Image rejection, selectivity Determines quality

## Question 3(b) [4 marks]

**Explain Diode Detector circuit.**

**Answer**:

**Diode Detector Circuit:**

**Purpose:**

- Extracts original message signal from AM wave
- Also called envelope detector

**Circuit components:**

- Diode: Rectifies AM signal
- RC network: Filters carrier frequency
- R & C values: RC >> 1/fc and RC << 1/fm

**Operation:**

1. Diode conducts during positive half-cycles
2. Capacitor charges to peak value
3. Capacitor discharges through resistor
4. RC time constant critical for proper demodulation

**Diagram:**

```goat
          D
        +-----|>|----+
        |            |
Input   |            C    R     Output
AM      |            |    |      
        +------------+----+-----+
                     |          |
                    ---        ---
                     -          -
```

**Waveforms:**

```goat
Input:                  After Diode:            Output:
    /\      /\              /\      /\              _____
   /  \    /  \            /  \    /  \            /     \
  /    \  /    \    →     /    \  /    \    →     /       \
 /      \/      \        /      \/      \
```

**Limitations:**

- Distortion for high modulation index
- Poor performance at low signal levels

**Mnemonic:** "DRCO" - Diode Rectifies, Capacitor holds peaks, Output follows envelope

## Question 3(c) [7 marks]

**Draw and explain block diagram of super heterodyne receiver.**

**Answer**:

**Super Heterodyne Receiver:**

**Block Diagram:**

```goat
+--------+    +-------+    +------+    +-----+    +--------+    +--------+    +--------+
| Antenna|--->| RF    |--->| Mixer|--->| IF  |--->|Detector|--->| Audio  |--->|Speaker |
|        |    | Amp   |    |      |    | Amp |    |        |    | Amp    |    |        |
+--------+    +-------+    +------+    +-----+    +--------+    +--------+    +--------+
                              ^
                              |
                        +------------+
                        | Local      |
                        | Oscillator |
                        +------------+
```

**Function of each block:**

1. **RF Amplifier:**
   - Amplifies weak RF signals
   - Provides selectivity
   - Improves signal-to-noise ratio

2. **Local Oscillator:**
   - Generates stable frequency fLO
   - fLO = fRF + fIF (for high-side injection)
   - Tuned with RF amplifier

3. **Mixer:**
   - Combines RF signal with local oscillator
   - Produces sum and difference frequencies
   - Difference frequency = IF (intermediate frequency)

4. **IF Amplifier:**
   - Fixed frequency amplification (typically 455kHz for AM)
   - Provides most of receiver gain and selectivity
   - Multiple stages for better performance

5. **Detector:**
   - Demodulates IF signal
   - Extracts original message signal
   - Diode detector for AM, discriminator for FM

6. **Audio Amplifier:**
   - Amplifies demodulated signal
   - Drives speaker or headphones

**Working principle:**

- Converts any RF frequency to fixed IF for efficient amplification
- IF frequency = |fRF - fLO|

**Advantages:**

- Better selectivity and sensitivity
- Stable gain at all frequencies
- Reduced tracking problems

**Mnemonic:** "RLMIDS" - RF amp, Local oscillator, Mixer, IF amp, Detector, Speaker

## Question 3(a) OR [3 marks]

**Describe AGC principle and its application in Radio receiver.**

**Answer**:

**AGC (Automatic Gain Control) Principle:**

**Definition:**

- Circuit that automatically adjusts receiver gain based on signal strength
- Maintains constant output level despite varying input signals

**Working principle:**

1. Detects received signal strength
2. Generates control voltage proportional to signal
3. Applies negative feedback to reduce gain for strong signals
4. Increases gain for weak signals

**Application in Radio Receiver:**

- **Prevents overloading:** Protects against strong signal distortion
- **Compensates fading:** Maintains constant volume during signal fading
- **Controls IF amplifier:** Primarily applied to IF stages
- **Improves dynamic range:** Handles wide range of signal strengths

**Types:**

- **Simple AGC:** Direct feedback from detector
- **Delayed AGC:** Only activates above threshold level
- **Amplified AGC:** Uses additional amplifier for better control

**Diagram:**

```goat
     +-------+    +------+    +-----+    +--------+
     | RF    |--->| Mixer|--->| IF  |--->|Detector|---> Audio
     | Amp   |    |      |    | Amp |    |        |
     +---|---+    +------+    +-|---+    +----|---+
         |                      |             |
         |                      |         +--------+
         |                      |---------|  AGC   |
         |                                | Circuit|
         +--------------------------------|        |
                                          +--------+
```

**Mnemonic:** "FADS" - Fading compensation, Automatic adjustment, Dynamic range, Signal consistency

## Question 3(b) OR [4 marks]

**Write short-note on intermediate frequency**

**Answer**:

**Intermediate Frequency (IF):**

**Definition:**

- Fixed frequency to which incoming RF signal is converted in superheterodyne receivers
- Result of mixing (heterodyning) RF signal with local oscillator

**Standard IF values:**

- **AM radio:** 455 kHz
- **FM radio:** 10.7 MHz
- **TV receivers:** 38-41 MHz

**Importance:**

- **Consistent gain:** Amplifiers operate at fixed frequency
- **Better selectivity:** Narrowband filters at fixed frequency
- **Simplified design:** Easier to design efficient fixed-frequency stages

**Selection criteria:**

- High enough to provide good image rejection
- Low enough for practical filter Q and gain
- Should avoid harmonics of common signals

**Image frequency calculation:**

- High-side injection: fimage = fRF + 2fIF
- Low-side injection: fimage = fRF - 2fIF

**Diagram:**

```goat
   Original      IF Stage      Audio
   Spectrum        Fixed       Output
     |  |           |  |          |
     V  V           V  V          V
+----------+    +----------+    +-----+
|  Mixer   |--->|    IF    |--->| Det |
+----------+    +----------+    +-----+
      ^
      |
+------------+
|  Local     |
| Oscillator |
+------------+
```

**Mnemonic:** "CIGS" - Conversion, Improved selectivity, Gain stability, Simplified design

## Question 3(c) OR [7 marks]

**Explain phase discriminator circuit for FM detection.**

**Answer**:

**Phase Discriminator for FM Detection:**

**Purpose:**

- Converts frequency variations in FM signal to amplitude variations
- Demodulates FM signal to recover original message

**Circuit components:**

- Center-tapped transformer
- Two diodes (D1 and D2)
- RC filter network
- Phase-shifting network (L-C circuit)

**Working principle:**

1. Input FM signal splits into two paths
2. Reference path goes directly to center tap
3. Phase-shifted path passes through LC network
4. Phase shift varies with frequency deviation
5. Two diodes produce voltages proportional to phase difference
6. Output voltage varies with input frequency

**Circuit diagram:**

```goat
                      D1
              +------|>|------+
              |               |
              |               R1
              |               |
              |               |
 FM Input     |               +---+
 +------+     |                   |
 |      |-----+                   +--- Output
 +------+     |                   |
              |               +---+
              |               |
              |               R2
              |               |
              +------|<|------+
                      D2
```

**Characteristics:**

- **Linear response** over moderate frequency range
- **Balanced design** reduces amplitude variations
- **High sensitivity** to frequency changes
- **Limitations** at extreme frequency deviations

**S-curve response:**

```goat
    ^
    |              /
    |             /
    |            /
 0V +------------
    |          /
    |         /
    |        /
    +----------------->
       fc-Δf  fc  fc+Δf
```

**Mnemonic:** "PSDO" - Phase shift Demodulates, Signal frequency determines Output

## Question 4(a) [3 marks]

**Compare analog and digital communication techniques**

**Answer**:

**Comparison of Analog vs. Digital Communication:**

| Parameter | Analog Communication | Digital Communication |
|-----------|----------------------|------------------------|
| **Signal** | Continuous waveform | Discrete binary values |
| **Bandwidth** | Less bandwidth required | More bandwidth required |
| **Noise Immunity** | Poor, noise accumulates | Excellent, error correction possible |
| **Power Efficiency** | Less efficient | More efficient |
| **Quality** | Degrades with distance | Maintains quality until SNR threshold |
| **Multiplexing** | FDM primarily used | TDM primarily used |
| **System Complexity** | Simpler | More complex |
| **Cost** | Lower | Higher but decreasing |
| **Examples** | AM/FM radio, analog TV | Mobile networks, digital TV, internet |

**Mnemonic:** "BNPQ MCE" - Bandwidth, Noise immunity, Power, Quality, Multiplexing, Complexity, Efficiency

## Question 4(b) [4 marks]

**Explain Adaptive delta modulation with its application.**

**Answer**:

**Adaptive Delta Modulation (ADM):**

**Definition:**

- Improved version of Delta Modulation (DM)
- Uses variable step size adjusted to signal slope

**Working principle:**

1. Compares input signal with predicted value
2. Outputs binary 1 or 0 based on comparison
3. Adjusts step size based on consecutive bits
4. Increases step size for rapid changes
5. Decreases step size for slow changes

**Advantages over Delta Modulation:**

- Reduces slope overload distortion
- Minimizes granular noise
- Better dynamic range
- Lower bit rate for same quality

**Diagram:**

```goat
                        +-------+
                        |       |
                        | Step  |<--+
Input                   | Size  |   |
  +---+    +---+        | Logic |   |
  |   |--->|+/-|------->|       |   |
  +---+    +---+        +-------+   |
    ^        |              |       |
    |        |              V       |
    |      +---+         +---+      |
    +------|   |<--------| Δ |------+
           +---+         +---+
           Integrator
```

**Applications:**

- **Speech transmission:** Voice over digital networks
- **Audio compression:** Music storage and transmission
- **Telemetry systems:** Remote data collection
- **Military communications:** Secure transmission

**Mnemonic:** "VSOG" - Variable Step size Overcomes Granular noise & slope overload

## Question 4(c) [7 marks]

**Draw & explain block diagram of PCM system.**

**Answer**:

**Pulse Code Modulation (PCM) System:**

**Block Diagram:**

```goat
                  +-------+    +----------+    +---------+    +--------+
                  |       |    |          |    |         |    |        |
Input signal ---->|Sample |--->|Quantizer |--->|Encoder  |--->|Channel |
                  |& Hold |    |          |    |         |    |        |
                  +-------+    +----------+    +---------+    +--------+
                                                                  |
                                                                  V
                  +--------+    +---------+    +---------+    +--------+
                  |        |    |         |    |         |    |        |
Output signal <---|Low Pass|<---| DAC     |<---|Decoder  |<---| Buffer |
                  |Filter  |    |         |    |         |    |        |
                  +--------+    +---------+    +---------+    +--------+
```

**Transmitter components:**

1. **Sample & Hold:**
   - Samples analog signal at regular intervals
   - Nyquist rate (fs ≥ 2fmax)
   - Holds value until next sample

2. **Quantizer:**
   - Divides amplitude range into discrete levels
   - Maps each sample to nearest level
   - Introduces quantization error

3. **Encoder:**
   - Converts quantized levels to binary code
   - n-bit encoder gives 2^n quantization levels
   - Common formats: 8-bit, 16-bit

**Receiver components:**

1. **Decoder:**
   - Converts binary to quantized levels
   - Reverses encoder operation

2. **Digital-to-Analog Converter (DAC):**
   - Converts discrete levels to analog values
   - Produces staircase approximation of signal

3. **Low-Pass Filter:**
   - Smooths staircase output
   - Removes high-frequency components
   - Reconstructs original waveform

**Key characteristics:**

- Sampling rate: Typically 8 kHz (voice), 44.1 kHz (CD audio)
- Resolution: 8-bit (256 levels) to 24-bit (16.8M levels)
- Bit rate = Sampling rate × bits per sample

**Mnemonic:** "SQEC-DFL" - Sample, Quantize, Encode, Channel - Decode, Filter, Listen

## Question 4(a) OR [3 marks]

**Explain quantization process and its necessity.**

**Answer**:

**Quantization Process and its Necessity:**

**Definition:**

- Process of mapping continuous amplitude values to discrete levels
- Second step in analog-to-digital conversion after sampling

**Process:**

1. Divide amplitude range into finite number of levels
2. Assign each sample to nearest quantization level
3. Represent each level with binary code
4. Quantization levels = 2^n (n = number of bits)

**Types:**

- **Uniform quantization:** Equal step size throughout range
- **Non-uniform quantization:** Variable step size (smaller for lower amplitudes)
- **Mid-tread quantization:** Zero is a valid level
- **Mid-rise quantization:** Zero falls between levels

**Necessity:**

- **Digital representation:** Enables conversion to binary format
- **Storage efficiency:** Allows finite storage of analog signals
- **Processing capability:** Enables digital signal processing
- **Transmission benefits:** Facilitates error correction and encryption

**Quantization error:**

- Difference between actual and quantized value
- Maximum error = ±Q/2 (where Q = step size)
- Signal-to-quantization-noise ratio: SQNR = 6.02n + 1.76 dB

**Diagram:**

```goat
  ^
  |                    Quantized
  |   Original         Output
  |    Signal          /|
  |      /\           / |
  |     /  \         /  |
  |    /    \       /   |
  |   /      \     /    |
  |  /        \   /     |
  | /          \ /      |
  +--------------------------->
                Time
```

**Mnemonic:** "DEBS" - Digitization Enables Binary Storage

## Question 4(b) OR [4 marks]

**Explain PCM receiver.**

**Answer**:

**PCM Receiver:**

**Block Diagram:**

```goat
                  +--------+    +---------+    +---------+    +--------+
                  |        |    |         |    |         |    |        |
Digital PCM  ---->| Buffer |--->| Decoder |--->|   DAC   |--->|Low Pass|---> Output Signal
  Input           |        |    |         |    |         |    | Filter |
                  +--------+    +---------+    +---------+    +--------+
```

**Components and their functions:**

1. **Buffer:**
   - Temporarily stores received PCM data
   - Compensates for timing variations
   - Provides protection against jitter

2. **Decoder:**
   - Converts binary code to quantized amplitude levels
   - Detects and corrects transmission errors (if error coding used)
   - Outputs discrete amplitude values

3. **Digital-to-Analog Converter (DAC):**
   - Converts digital values to analog voltage levels
   - Creates staircase approximation of original signal
   - Resolution determined by bit depth (2^n levels)

4. **Low-Pass Filter:**
   - Smooths the staircase waveform
   - Removes high-frequency components
   - Reconstructs continuous analog signal

**Waveforms in PCM Receiver:**

```goat
Digital Input      Decoded Values       DAC Output          Final Output
 1001              ----                  _                    /\
 0110              -  -                _| |_                 /  \
 1010       →      -- -        →      _|   |_       →       /    \
 0101              - - -             _|     |_             /      \
```

**Performance factors:**

- **SNR:** Determined by quantization bits (6.02n + 1.76 dB)
- **Bandwidth:** Depends on sampling rate and filter characteristics
- **Distortion:** Related to quantization error

**Mnemonic:** "BDFL" - Buffer stores, Decoder converts, Filter smooths, Listen to output

## Question 4(c) OR [7 marks]

**What is sampling? Explain types of sampling in brief.**

**Answer**:

**Sampling:**

**Definition:**
Sampling is the process of converting a continuous-time signal into a discrete-time signal by taking measurements (samples) at regular time intervals.

**Mathematical expression:**
x[n] = x(nTs), where n = 0, 1, 2...

- x[n] is discrete-time sample
- x(t) is continuous-time signal
- Ts is sampling period (1/fs)

**Nyquist Theorem:**

- Sampling frequency (fs) must be at least twice the highest frequency component (fmax) in the signal
- fs ≥ 2fmax
- Prevents aliasing (distortion due to overlap of spectrum)

**Types of Sampling:**

| Type | Description | Characteristics |
|------|-------------|-----------------|
| **Ideal Sampling** | Instantaneous samples at regular intervals | - Theoretical concept<br>- Represented by impulse train<br>- Infinite bandwidth required |
| **Natural Sampling** | Signal multiplied by pulse train with finite width | - Samples have same shape as signal<br>- Width determined by sampling pulse<br>- Used in analog systems |
| **Flat-Top Sampling** | Sample-and-hold technique | - Holds sampled value until next sample<br>- Creates staircase approximation<br>- Common in practical systems |

**Sampling Rates:**

- **Under-sampling:** fs < 2fmax (causes aliasing)
- **Critical sampling:** fs = 2fmax (minimum required rate)
- **Over-sampling:** fs > 2fmax (improves reconstruction quality)

**Diagram:**

```goat
Original Signal:     /\/\/\/\/\/\/\/\

Ideal Sampling:      |  |  |  |  |  |

Natural Sampling:    ▓  ▓  ▓  ▓  ▓  ▓

Flat-top Sampling:   ▔▔  ▔▔  ▔▔  ▔▔  ▔▔
```

**Mnemonic:** "INF" - Ideal (impulses), Natural (pulse-shaped), Flat-top (staircase)

## Question 5(a) [3 marks]

**List the need of Multiplexing.**

**Answer**:

**Need for Multiplexing:**

| Need | Description |
|------|-------------|
| **Bandwidth Utilization** | Efficiently uses available transmission bandwidth |
| **Cost Reduction** | Shares expensive transmission medium among multiple users |
| **Infrastructure Optimization** | Reduces physical connections and hardware requirements |
| **Spectrum Efficiency** | Maximizes use of limited frequency spectrum |
| **Network Capacity** | Increases number of channels/users on single medium |
| **Flexibility** | Allows dynamic allocation of resources based on demand |

**Mnemonic:** "BCSINF" - Bandwidth, Cost, Spectrum, Infrastructure, Network capacity, Flexibility

## Question 5(b) [4 marks]

**Explain working of DPCM.**

**Answer**:

**Differential Pulse Code Modulation (DPCM):**

**Definition:**

- Enhanced version of PCM that encodes difference between current and predicted sample
- Exploits correlation between adjacent samples to reduce bit rate

**Block Diagram:**

```goat
                  +------+     +----------+    +---------+
                  |      |     |          |    |         |
Input signal ---->| ADC  |--+->|Quantizer |--->|Encoder  |---> DPCM Output
                  |      |  |  |          |    |         |
                  +------+  |  +----------+    +---------+
                            |        ^
                            |        |
                            v        |
                        +---------+  |
                        |Predictor|--+
                        +---------+
```

**Working principle:**

1. Current sample is predicted based on previous sample(s)
2. Only the difference (error) between actual and predicted value is encoded
3. Smaller difference requires fewer bits than full amplitude
4. Predictor uses previous reconstructed values for prediction

**Advantages:**

- **Reduced bit rate:** Typically 25-50% lower than PCM
- **Better SNR:** For same bit rate as PCM
- **Correlation utilization:** Exploits signal redundancy

**Limitations:**

- **Error propagation:** Errors affect subsequent samples
- **Complexity:** More complex than simple PCM
- **Signal dependency:** Performance varies with signal characteristics

**Mnemonic:** "PDQE" - Predict sample, Difference calculated, Quantize error, Encode result

## Question 5(c) [7 marks]

**The binary data 1011001 is to be transmitted using following line coding techniques: (i) Unipolar RZ and NRZ (ii) Polar RZ and NRZ (iii) AMI (iv) Manchester. Draw all the waveforms.**

**Answer**:

**Line Coding of Binary Data: 1011001**

**Waveforms:**

```goat
Binary Data:   1   0   1   1   0   0   1
              _   _   _   _   _   _   _

1. Unipolar NRZ:
              ▔▔▔   ▔▔▔▔▔▔   ▔▔▔
              ___ ▔▔▔ _______ ▔▔▔

2. Unipolar RZ:
              ▔ _ ▔ _ ▔ ▔ _ _ _ ▔ _
              _ _ _ _ _ _ _ _ _ _ _ _

3. Polar NRZ:
              ▔▔▔   ▔▔▔▔▔▔   ▔▔▔
              ___ ▔▔▔ _______ ▔▔▔

4. Polar RZ:
              ▔ _ _ _ ▔ ▔ _ _ _ ▔ _
              _ ▔ _ _ _ _ ▔ ▔ _ _ _

5. AMI:
              ▔ _   ▔ _ _ _ ▔ _
              _ _ ▔ _ _ _ _ _ _ _ _

6. Manchester:
              ▔▁ ▁▔ ▔▁ ▔▁ ▁▔ ▁▔ ▔▁
              _ _ _ _ _ _ _ _ _ _ _ _
```

**Characteristics of Each Coding:**

| Coding Technique | Description | Advantages | Disadvantages |
|------------------|-------------|------------|---------------|
| **Unipolar NRZ** | 1 = high voltage<br>0 = zero voltage<br>No return to zero | Simple implementation | DC component, no clock recovery |
| **Unipolar RZ** | 1 = high for half bit<br>0 = zero voltage<br>Returns to zero | Self-clocking | Requires more bandwidth |
| **Polar NRZ** | 1 = positive voltage<br>0 = negative voltage<br>No return to zero | No DC component | Poor clock recovery |
| **Polar RZ** | 1 = positive for half bit<br>0 = negative for half bit<br>Returns to zero | Self-clocking, no DC component | Requires more bandwidth |
| **AMI** | 1 = alternating +/- voltage<br>0 = zero voltage | No DC component, error detection | Long strings of zeros problematic |
| **Manchester** | 1 = transition low to high<br>0 = transition high to low | Self-clocking, no DC component | Requires double bandwidth |

**Mnemonic:** "UPRMA" - Unipolar, Polar, Return-to-zero, Manchester, AMI line coding techniques

## Question 5(a) OR [3 marks]

**Explain polar RZ and NRZ format**

**Answer**:

**Polar RZ and NRZ Line Coding:**

**Polar NRZ (Non-Return to Zero):**

- Binary 1: Positive voltage (+V) for entire bit duration
- Binary 0: Negative voltage (-V) for entire bit duration
- Signal remains at level during entire bit period
- No transition to zero between consecutive similar bits

**Characteristics of Polar NRZ:**

- **Bandwidth efficiency:** Requires minimum bandwidth
- **DC component:** Zero average for equal 1s and 0s
- **Clock recovery:** Poor for long sequences of same bit
- **Error detection:** No inherent capability

**Polar RZ (Return to Zero):**

- Binary 1: Positive voltage (+V) for half bit, zero for remainder
- Binary 0: Negative voltage (-V) for half bit, zero for remainder
- Signal returns to zero during each bit period

**Characteristics of Polar RZ:**

- **Bandwidth:** Requires twice the bandwidth of NRZ
- **Self-clocking:** Better clock recovery
- **Power requirement:** Higher than NRZ
- **Error detection:** No inherent capability

**Waveform Comparison:**

```goat
Binary Data:   1   0   1   1   0   0   1
              _   _   _   _   _   _   _

Polar NRZ:    ▔▔▔   ▔▔▔▔▔▔   ▔▔▔
              ___ ▔▔▔ _______ ▔▔▔

Polar RZ:     ▔ _ _ _ ▔ ▔ _ _ _ ▔ _
              _ ▔ _ _ _ _ ▔ ▔ _ _ _
```

**Mnemonic:** "HZRT" - Half bit active + Zero Return in RZ, full Time in NRZ

## Question 5(b) OR [4 marks]

**Explain delta modulation in brief.**

**Answer**:

**Delta Modulation (DM):**

**Definition:**

- Simplest form of differential encoding
- Encodes only the sign of difference between current and previous sample
- Single bit per sample for transmission (1 or 0)

**Block Diagram:**

```goat
                    +-----+       Encoded
 Input      +---+   |     |      Bitstream
 Signal --->|+/-|--->  C  |---------->
            +---+   |     |
              ^     +-----+
              |        |
              |        v
            +---+    +---+
            |   |<---|+/-|
            +---+    +---+
          Integrator   Step Size
```

**Working principle:**

1. Compare input signal with predicted value (from integrator)
2. If input > predicted: Output = 1, increase predicted value
3. If input < predicted: Output = 0, decrease predicted value
4. Step size determines how much predicted value changes

**Advantages:**

- **Simple implementation:** Minimal hardware
- **Low bit rate:** 1 bit per sample
- **Robust:** Relatively immune to channel noise

**Limitations:**

- **Slope overload:** Cannot track rapid signal changes
- **Granular noise:** Oscillations around steady signals
- **Limited resolution:** Quality depends on step size and sampling rate

**Waveforms:**

```goat
Original:      /\/\/\/\

Reconstructed: /\/\/\/\
               (Staircase approximation)

Binary output: 1101001011
```

**Mnemonic:** "1BSG" - 1 Bit per Sample, Slope overload and Granular noise limitations

## Question 5(c) OR [7 marks]

**Explain PCM-TDM system.**

**Answer**:

**PCM-TDM System:**

**Definition:**

- Combined system using Pulse Code Modulation (PCM) with Time Division Multiplexing (TDM)
- Multiple analog channels converted to digital PCM, then multiplexed in time

**Block Diagram:**

```goat
                 +-------+     +--------+     +---------+
 Channel 1 ----->| PCM 1 |---->|        |     |         |
                 +-------+     |        |     |         |
                 +-------+     |        |     |         |     Multiplexed
 Channel 2 ----->| PCM 2 |---->|  Time  |---->|  Frame  |---> PCM-TDM
                 +-------+     |        |     | Format  |     Output
                               |  MUX   |     |         |
                 +-------+     |        |     |         |
 Channel N ----->| PCM N |---->|        |     |         |
                 +-------+     +--------+     +---------+
```

**PCM Process for Each Channel:**

1. **Sampling:** Each channel sampled at fs ≥ 2fmax
2. **Quantization:** Samples assigned to discrete levels
3. **Encoding:** Quantized values converted to binary code

**TDM Frame Structure:**

- Frame consists of one sample from each channel
- Frame includes synchronization bits/word
- Frame rate equals sampling rate (fs)
- Bit rate = fs × N × n (N = channels, n = bits/sample)

**Typical Parameters:**

- **Voice channels:** 8 kHz sampling, 8 bits/sample
- **T1 system:** 24 channels, 1.544 Mbps
- **E1 system:** 30 channels, 2.048 Mbps

**Advantages:**

- **Efficient transmission:** Single high-speed link
- **Digital benefits:** Noise immunity, regeneration
- **Flexibility:** Easy to add/drop channels

**Applications:**

- **Telephone networks:** Digital transmission systems
- **Digital audio:** Broadcasting and recording
- **Satellite communications:** Multiple channel transmission

**Diagram of TDM Frame:**

```goat
   |<-------------- One TDM Frame -------------->|
   +-----+-----+-----+-----+-----+       +-----+
   | Sync| Ch1 | Ch2 | Ch3 | Ch4 | ..... | ChN |
   +-----+-----+-----+-----+-----+       +-----+
```

**Mnemonic:** "MSQT" - Multiplex, Sample, Quantize, Transmit
