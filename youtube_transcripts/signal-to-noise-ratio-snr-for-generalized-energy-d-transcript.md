<!--
Complete Transcript: Signal-to-Noise Ratio (SNR) for Generalized Energy Detector in the Presence of Noise Uncertainty ...
Original by: Milav Dabgar
Duration: 29 minutes

Dr. James: Welcome to the deep dive. Today we're uh Welcome to the deep dive. Today we're uh plunging into something pretty invisible plunging into something pretty invisible

Sarah: plunging into something pretty invisible but absolutely crucial. It's the world

[click]

Dr. James: but absolutely crucial. It's the world

Sarah: but absolutely crucial. It's the world of radio waves that well basically runs of radio waves that well basically runs of radio waves that well basically runs our modern lives. our modern lives. our modern lives. It really does. Everything from your

Sarah: It really does. Everything from your It really does. Everything from your Wi-Fi, your mobile phone connection, Wi-Fi, your mobile phone connection, Wi-Fi, your mobile phone connection, Bluetooth. It's all happening on these

Sarah: Bluetooth. It's all happening on these Bluetooth. It's all happening on these uh these air waves. uh these air waves. uh these air waves. Exactly. But here's the thing, and this Exactly. But here's the thing, and this

Sarah: Exactly. But here's the thing, and this is what kind of grabs you. These

[click]

Dr. James: is what kind of grabs you. These is what kind of grabs you. These airwaves or the radio frequency spectrum airwaves or the radio frequency spectrum airwaves or the radio frequency spectrum technically speaking, they're not

Dr. James: technically speaking, they're not technically speaking, they're not infinite. Not at all. infinite. Not at all.

Sarah: infinite. Not at all. Far from it. It's a finite resource,

[click]

Dr. James: Far from it. It's a finite resource,

Sarah: Far from it. It's a finite resource, incredibly valuable, and most of it is incredibly valuable, and most of it is incredibly valuable, and most of it is already licensed out, already licensed out,

[click]

Dr. James: already licensed out, right? Licensed. But here's the paradox, right? Licensed. But here's the paradox, right? Licensed. But here's the paradox, isn't it? A lot of this licensed isn't it? A lot of this licensed

Dr. James: isn't it? A lot of this licensed spectrum, this sort of prime digital spectrum, this sort of prime digital spectrum, this sort of prime digital real estate, often just sits there real estate, often just sits there

[click]

Dr. James: real estate, often just sits there underutilized. underutilized.

Sarah: underutilized. It's a huge inefficiency. Think of it It's a huge inefficiency. Think of it It's a huge inefficiency. Think of it like uh owning a massive skyscraper in a like uh owning a massive skyscraper in a

Sarah: like uh owning a massive skyscraper in a bustling downtown area, but keeping most bustling downtown area, but keeping most bustling downtown area, but keeping most of the floors completely empty most of

Sarah: of the floors completely empty most of of the floors completely empty most of the time, the time, the time, while everyone outside is desperate for while everyone outside is desperate for while everyone outside is desperate for office space.

Sarah: office space. office space. Precisely. And that scarcity, that Precisely. And that scarcity, that Precisely. And that scarcity, that bottleneck is a real drag on innovation, bottleneck is a real drag on innovation,

Sarah: bottleneck is a real drag on innovation, especially with how connected everything especially with how connected everything especially with how connected everything is becoming.

[click]

Dr. James: is becoming. is becoming. Okay, so that sets the stage perfectly Okay, so that sets the stage perfectly Okay, so that sets the stage perfectly for our main topic, cognitive radio or for our main topic, cognitive radio or

Sarah: for our main topic, cognitive radio or CR. This is supposed to be the smart CR. This is supposed to be the smart

Dr. James: CR. This is supposed to be the smart solution, right? solution, right? solution, right? That's the idea. Cognitive radio came

[click]

Sarah: That's the idea. Cognitive radio came That's the idea. Cognitive radio came about to tackle this very problem. It about to tackle this very problem. It about to tackle this very problem. It let secondary users think of them as, I

Sarah: let secondary users think of them as, I let secondary users think of them as, I don't know, opportunistic renters use

Dr. James: don't know, opportunistic renters use don't know, opportunistic renters use licensed bands intelligently. But only licensed bands intelligently. But only licensed bands intelligently. But only when the primary users, the owners,

Dr. James: when the primary users, the owners, when the primary users, the owners, aren't actually using them at that aren't actually using them at that aren't actually using them at that moment. moment.

[click]

Sarah: moment. Exactly. It's about smart sharing, Exactly. It's about smart sharing, Exactly. It's about smart sharing, getting the most out of what we have getting the most out of what we have getting the most out of what we have without stepping on the original owner's

Sarah: without stepping on the original owner's without stepping on the original owner's toes. toes. toes. For that whole system to work, for CR to For that whole system to work, for CR to For that whole system to work, for CR to be, you know, viable, there's one

Sarah: be, you know, viable, there's one

Dr. James: be, you know, viable, there's one absolutely critical piece.

[click]

Sarah: absolutely critical piece.

Dr. James: absolutely critical piece. Spectrum sensing. Yeah. The secondary Spectrum sensing. Yeah. The secondary Spectrum sensing. Yeah. The secondary users have to know accurately whether users have to know accurately whether

Dr. James: users have to know accurately whether the primary user is transmitting or not. the primary user is transmitting or not. the primary user is transmitting or not. It's the absolute foundation, isn't it? It's the absolute foundation, isn't it?

Dr. James: It's the absolute foundation, isn't it? If the sensing is off, If the sensing is off, If the sensing is off, chaos. You either get interference, chaos. You either get interference, chaos. You either get interference, which is bad news for the primary user,

Dr. James: which is bad news for the primary user, which is bad news for the primary user, potentially disrupting critical potentially disrupting critical potentially disrupting critical services, services, services, or you get missed opportunities where

Dr. James: or you get missed opportunities where or you get missed opportunities where the secondary user thinks the band is the secondary user thinks the band is

[click]

Sarah: the secondary user thinks the band is busy when it's actually free, defeating busy when it's actually free, defeating busy when it's actually free, defeating the purpose of CR. the purpose of CR.

Dr. James: the purpose of CR. Right? So, this sensing has to be Right? So, this sensing has to be Right? So, this sensing has to be incredibly reliable. incredibly reliable.

[click]

Sarah: incredibly reliable. And that's the core challenge we're And that's the core challenge we're And that's the core challenge we're diving into today because traditional diving into today because traditional

[click]

Sarah: diving into today because traditional spectrum sensing methods, they really spectrum sensing methods, they really spectrum sensing methods, they really struggle in the real world. struggle in the real world.

Dr. James: struggle in the real world. Oh, absolutely. We're talking low signal Oh, absolutely. We're talking low signal Oh, absolutely. We're talking low signal strength where the signal you're looking strength where the signal you're looking

[click]

Dr. James: strength where the signal you're looking for is barely above the noise for is barely above the noise

Sarah: for is barely above the noise and the noise itself isn't stable. It's and the noise itself isn't stable. It's and the noise itself isn't stable. It's unpredictable. What they call noise unpredictable. What they call noise

Sarah: unpredictable. What they call noise uncertainty. uncertainty. uncertainty. Plus, you've got signal fading where the Plus, you've got signal fading where the Plus, you've got signal fading where the signal strength just fluctuates wildly

Sarah: signal strength just fluctuates wildly signal strength just fluctuates wildly because of the environment. These aren't because of the environment. These aren't because of the environment. These aren't small issues.

Sarah: small issues.

[click]

Dr. James: small issues. Not at all. So, the research paper we're

Sarah: Not at all. So, the research paper we're

[click]

Dr. James: Not at all. So, the research paper we're digging into today tackles these exact digging into today tackles these exact digging into today tackles these exact problems. It looks at advanced problems. It looks at advanced

Dr. James: problems. It looks at advanced techniques, specifically something techniques, specifically something techniques, specifically something called generalized energy detectors or called generalized energy detectors or

Dr. James: called generalized energy detectors or GEDs. And it really gets into the weeds GEDs. And it really gets into the weeds GEDs. And it really gets into the weeds on how these detectors perform under on how these detectors perform under

Dr. James: on how these detectors perform under tough conditions, especially when you tough conditions, especially when you tough conditions, especially when you use multiple receivers. And it explores use multiple receivers. And it explores

Dr. James: use multiple receivers. And it explores this really fascinating um slightly this really fascinating um slightly this really fascinating um slightly scary concept called the SNR wall. scary concept called the SNR wall.

Dr. James: scary concept called the SNR wall. The SNR wall sounds ominous. So what are The SNR wall sounds ominous. So what are The SNR wall sounds ominous. So what are we hoping to uncover here? Well, we'll we hoping to uncover here? Well, we'll

Dr. James: we hoping to uncover here? Well, we'll see how these fundamental noise issues see how these fundamental noise issues

Sarah: see how these fundamental noise issues can actually create hard limits, these

[click]

Dr. James: can actually create hard limits, these can actually create hard limits, these walls on communication reliability, walls on communication reliability, walls on communication reliability, but also how clever engineering like

Dr. James: but also how clever engineering like but also how clever engineering like using diversity schemes can help push using diversity schemes can help push using diversity schemes can help push back against those limits.

Dr. James: back against those limits. back against those limits. Exactly. And we might find some

Sarah: Exactly. And we might find some Exactly. And we might find some surprising things about what actually surprising things about what actually surprising things about what actually degrades performance the most in the

Sarah: degrades performance the most in the

[click]

Dr. James: degrades performance the most in the real world. It challenges some common real world. It challenges some common real world. It challenges some common assumptions. assumptions. assumptions. Okay, sounds like a fascinating journey.

Dr. James: Okay, sounds like a fascinating journey. Okay, sounds like a fascinating journey. Let's start with the basics then. This Let's start with the basics then. This Let's start with the basics then. This silent battle for bandwidth, right? This

Dr. James: silent battle for bandwidth, right? This silent battle for bandwidth, right? This idea of spectrum being scarce. It can idea of spectrum being scarce. It can

Sarah: idea of spectrum being scarce. It can feel bit abstract maybe it's not like feel bit abstract maybe it's not like feel bit abstract maybe it's not like running out of fuel. You can see running out of fuel. You can see

Sarah: running out of fuel. You can see true but the impact is very real. Most true but the impact is very real. Most true but the impact is very real. Most of the usable radio frequencies are of the usable radio frequencies are

[click]

Sarah: of the usable radio frequencies are already licensed. Think mobile carriers, already licensed. Think mobile carriers, already licensed. Think mobile carriers, TV broadcasters, emergency services. TV broadcasters, emergency services.

Sarah: TV broadcasters, emergency services. They've paid for exclusive rights to use They've paid for exclusive rights to use They've paid for exclusive rights to use specific chunks of spectrum specific chunks of spectrum

[click]

Sarah: specific chunks of spectrum like owning plots of land but in the like owning plots of land but in the like owning plots of land but in the airwaves. airwaves. airwaves. A good analogy. But then studies

Sarah: A good analogy. But then studies A good analogy. But then studies consistently show that much of this consistently show that much of this consistently show that much of this licensed land is well empty a lot of the

Sarah: licensed land is well empty a lot of the licensed land is well empty a lot of the time, underutilized, time, underutilized, time, underutilized, which seems incredibly wasteful.

[click]

Dr. James: which seems incredibly wasteful. which seems incredibly wasteful. It is. It's like having a massive

Sarah: It is. It's like having a massive It is. It's like having a massive highway with say 20 lanes but only ever highway with say 20 lanes but only ever highway with say 20 lanes but only ever using three or four while the entrance

Sarah: using three or four while the entrance using three or four while the entrance ramps are totally gridlocked. ramps are totally gridlocked. ramps are totally gridlocked. That's a powerful image. And that

Sarah: That's a powerful image. And that That's a powerful image. And that gridlock, that bottleneck directly gridlock, that bottleneck directly

[click]

Dr. James: gridlock, that bottleneck directly impacts us, right? It slows down impacts us, right? It slows down impacts us, right? It slows down innovation. innovation. innovation. Absolutely. Think about the explosion in

Sarah: Absolutely. Think about the explosion in

Dr. James: Absolutely. Think about the explosion in wireless demand. More devices, faster wireless demand. More devices, faster wireless demand. More devices, faster speeds, the internet of things, 5G. It speeds, the internet of things, 5G. It

Dr. James: speeds, the internet of things, 5G. It all needs spectrum. Yeah. If chunks of all needs spectrum. Yeah. If chunks of all needs spectrum. Yeah. If chunks of it are locked away and unused, it holds it are locked away and unused, it holds

[click]

Dr. James: it are locked away and unused, it holds everything back. everything back.

[click]

Sarah: everything back. So, it's an economic issue, a societal

Dr. James: So, it's an economic issue, a societal

[click]

Sarah: So, it's an economic issue, a societal issue, not just a technical one. We need

Dr. James: issue, not just a technical one. We need issue, not just a technical one. We need more capacity. And just building more more capacity. And just building more more capacity. And just building more lanes isn't always feasible or

Dr. James: lanes isn't always feasible or lanes isn't always feasible or efficient. efficient.

[click]

Sarah: efficient. Exactly. And that's where cognitive Exactly. And that's where cognitive Exactly. And that's where cognitive radio comes in as such an elegant radio comes in as such an elegant radio comes in as such an elegant approach. It's not about building new

Sarah: approach. It's not about building new approach. It's not about building new highways. It's about intelligently using highways. It's about intelligently using highways. It's about intelligently using the empty lanes on the existing ones,

Sarah: the empty lanes on the existing ones, the empty lanes on the existing ones, letting those secondary users slip in letting those secondary users slip in letting those secondary users slip in when the primary user isn't there.

Dr. James: when the primary user isn't there. when the primary user isn't there. Right? And this becomes absolutely Right? And this becomes absolutely Right? And this becomes absolutely fundamental for future tech. The paper

Dr. James: fundamental for future tech. The paper fundamental for future tech. The paper highlights things like the internet of highlights things like the internet of highlights things like the internet of things, IoT and 5G.

Dr. James: things, IoT and 5G. things, IoT and 5G. Okay, let's connect that. Why are IoT Okay, let's connect that. Why are IoT Okay, let's connect that. Why are IoT and 5G particularly dependent on this and 5G particularly dependent on this

Dr. James: and 5G particularly dependent on this kind of smart spectrum use? What's kind of smart spectrum use? What's kind of smart spectrum use? What's different about them? different about them? different about them? It really boils down to scale and uh

Dr. James: It really boils down to scale and uh It really boils down to scale and uh flexibility. Take IoT. You're flexibility. Take IoT. You're flexibility. Take IoT. You're potentially talking billions, maybe potentially talking billions, maybe

[click]

Dr. James: potentially talking billions, maybe trillions of devices. trillions of devices. trillions of devices. Many of them, like sensors, might only Many of them, like sensors, might only Many of them, like sensors, might only need to transmit tiny bits of data very

Dr. James: need to transmit tiny bits of data very need to transmit tiny bits of data very infrequently. once an hour, once a day. infrequently. once an hour, once a day. infrequently. once an hour, once a day. Giving each one a dedicated frequency

Dr. James: Giving each one a dedicated frequency Giving each one a dedicated frequency would be insanely wasteful. would be insanely wasteful. would be insanely wasteful. Unsustainable. CR lets them just grab a Unsustainable. CR lets them just grab a

Dr. James: Unsustainable. CR lets them just grab a free slot when they need it, share the free slot when they need it, share the free slot when they need it, share the space efficiently. space efficiently. space efficiently. Makes sense. And 5G,

Dr. James: Makes sense. And 5G, Makes sense. And 5G, 5G is all about supporting hugely 5G is all about supporting hugely 5G is all about supporting hugely diverse applications simultaneously. diverse applications simultaneously.

[click]

Dr. James: diverse applications simultaneously. You've got massive data rates for You've got massive data rates for You've got massive data rates for phones, super low latency for things phones, super low latency for things

Dr. James: phones, super low latency for things like remote surgery or self-driving like remote surgery or self-driving like remote surgery or self-driving cars, and connecting vast numbers of cars, and connecting vast numbers of

[click]

Dr. James: cars, and connecting vast numbers of simple devices. So it needs access to a simple devices. So it needs access to a simple devices. So it needs access to a lot of different types of spectrum lot of different types of spectrum

Dr. James: lot of different types of spectrum flexibly. flexibly. flexibly. Exactly. It needs to dynamically access

Sarah: Exactly. It needs to dynamically access Exactly. It needs to dynamically access spectrum across low, mid, and high bands spectrum across low, mid, and high bands spectrum across low, mid, and high bands depending on the need. CR principles

Sarah: depending on the need. CR principles depending on the need. CR principles allow 5G networks to be much more allow 5G networks to be much more allow 5G networks to be much more adaptable and efficient in grabbing

Sarah: adaptable and efficient in grabbing adaptable and efficient in grabbing whatever spectrum is available and

[click]

Dr. James: whatever spectrum is available and whatever spectrum is available and suitable at that moment. If a TV channel suitable at that moment. If a TV channel suitable at that moment. If a TV channel is off air in a certain region at night,

Dr. James: is off air in a certain region at night, is off air in a certain region at night, why let that spectrum sit idle when a 5G why let that spectrum sit idle when a 5G why let that spectrum sit idle when a 5G network could use it temporarily?

Dr. James: network could use it temporarily? network could use it temporarily? Precisely. It's about dynamic

Sarah: Precisely. It's about dynamic Precisely. It's about dynamic intelligent utilization. intelligent utilization. intelligent utilization. Okay. It clearly makes a ton of sense Okay. It clearly makes a ton of sense

[click]

Sarah: Okay. It clearly makes a ton of sense from an efficiency perspective, but as from an efficiency perspective, but as from an efficiency perspective, but as you said earlier, the whole thing hinges you said earlier, the whole thing hinges

Sarah: you said earlier, the whole thing hinges entirely on that one crucial step, entirely on that one crucial step, entirely on that one crucial step, spectrum sensing. spectrum sensing. spectrum sensing. It's the gatekeeper. The secondary user

Sarah: It's the gatekeeper. The secondary user It's the gatekeeper. The secondary user has to know if the primary user is there has to know if the primary user is there has to know if the primary user is there or not.

Sarah: or not. or not. And if that sensing is wrong, we touched And if that sensing is wrong, we touched

[click]

Dr. James: And if that sensing is wrong, we touched on this, but let's reiterate the stakes. on this, but let's reiterate the stakes. on this, but let's reiterate the stakes. The stakes are high. A false negative

Dr. James: The stakes are high. A false negative

Sarah: The stakes are high. A false negative thinking the band is free when it's not thinking the band is free when it's not thinking the band is free when it's not causes harmful interference. Imagine causes harmful interference. Imagine

[click]

Sarah: causes harmful interference. Imagine jamming an emergency frequency or jamming an emergency frequency or jamming an emergency frequency or messing up air traffic control signals. messing up air traffic control signals.

Sarah: messing up air traffic control signals. Not good. Definitely not good. Not good. Definitely not good. Not good. Definitely not good. And a false positive thinking the band And a false positive thinking the band

[click]

Sarah: And a false positive thinking the band is occupied when it's actually free

[click]

Dr. James: is occupied when it's actually free is occupied when it's actually free means a missed opportunity. The means a missed opportunity. The means a missed opportunity. The secondary user doesn't transmit. And

Dr. James: secondary user doesn't transmit. And secondary user doesn't transmit. And we're back to that same problem of we're back to that same problem of we're back to that same problem of underutilized spectrum.

Dr. James: underutilized spectrum. underutilized spectrum. So the sensing needs to be incredibly

Sarah: So the sensing needs to be incredibly

[click]

Dr. James: So the sensing needs to be incredibly accurate, not too sensitive, not accurate, not too sensitive, not accurate, not too sensitive, not insensitive, insensitive, insensitive, just right. just right. just right. Exactly. The margin for error is razor

Sarah: Exactly. The margin for error is razor Exactly. The margin for error is razor thin. It's a really challenging thin. It's a really challenging thin. It's a really challenging detection problem. detection problem.

[click]

Dr. James: detection problem. Okay, so sensing is key. How do we Okay, so sensing is key. How do we Okay, so sensing is key. How do we actually do it? Let's start with the actually do it? Let's start with the actually do it? Let's start with the most common, maybe the simplest

Dr. James: most common, maybe the simplest most common, maybe the simplest approach, energy detection or ED. approach, energy detection or ED. approach, energy detection or ED. Right? ED is popular mainly because it's

Dr. James: Right? ED is popular mainly because it's Right? ED is popular mainly because it's relatively easy to implement. And relatively easy to implement. And relatively easy to implement. And crucially, you don't need to know

Dr. James: crucially, you don't need to know crucially, you don't need to know anything specific about the primary user anything specific about the primary user anything specific about the primary user signal beforehand.

Dr. James: signal beforehand. signal beforehand. You don't need its fingerprint, so to You don't need its fingerprint, so to You don't need its fingerprint, so to speak. speak. speak. Exactly. No need to know its modulation

Sarah: Exactly. No need to know its modulation Exactly. No need to know its modulation type, data rate, anything like that. It type, data rate, anything like that. It type, data rate, anything like that. It just measures the total energy in the

Sarah: just measures the total energy in the just measures the total energy in the frequency band over a certain time frequency band over a certain time frequency band over a certain time and compares it to a threshold.

Sarah: and compares it to a threshold. and compares it to a threshold. Yep. If the energy is above a preset Yep. If the energy is above a preset Yep. If the energy is above a preset threshold, it assumes the primary user

Sarah: threshold, it assumes the primary user threshold, it assumes the primary user is present. Below the threshold, it

Dr. James: is present. Below the threshold, it is present. Below the threshold, it assumes the band is free. assumes the band is free.

[click]

Sarah: assumes the band is free. It's like listening in a quiet room. You It's like listening in a quiet room. You

Dr. James: It's like listening in a quiet room. You don't care what the sound is, just if don't care what the sound is, just if don't care what the sound is, just if there's enough sound energy to say there's enough sound energy to say

Dr. James: there's enough sound energy to say someone's likely there.

[click]

Sarah: someone's likely there.

Dr. James: someone's likely there. That's a great analogy. Simple presence

[click]

Sarah: That's a great analogy. Simple presence That's a great analogy. Simple presence or absence based purely on energy level. or absence based purely on energy level. or absence based purely on energy level. But simple often comes with a catch,

Sarah: But simple often comes with a catch,

Dr. James: But simple often comes with a catch, right? What's the downside of ED? right? What's the downside of ED? right? What's the downside of ED? The big catch is its performance. It The big catch is its performance. It

Dr. James: The big catch is its performance. It really struggles sometimes fails really struggles sometimes fails really struggles sometimes fails completely under challenging real world completely under challenging real world

Dr. James: completely under challenging real world conditions conditions conditions like the ones we mentioned earlier. like the ones we mentioned earlier. like the ones we mentioned earlier. Exactly. Low signal to noise ratio or

Sarah: Exactly. Low signal to noise ratio or Exactly. Low signal to noise ratio or SNR where the signal is weak compared to SNR where the signal is weak compared to SNR where the signal is weak compared to the background noise. Noise uncertainty

Sarah: the background noise. Noise uncertainty the background noise. Noise uncertainty where that noise level itself is

[click]

Dr. James: where that noise level itself is where that noise level itself is fluctuating and unpredictable and fading fluctuating and unpredictable and fading fluctuating and unpredictable and fading where the signal strength dips or varies

Dr. James: where the signal strength dips or varies where the signal strength dips or varies wildly. wildly. wildly. So in those common messy scenarios, ED

Sarah: So in those common messy scenarios, ED

[click]

Dr. James: So in those common messy scenarios, ED just isn't reliable enough. just isn't reliable enough. just isn't reliable enough. Often no. it becomes very prone to Often no. it becomes very prone to Often no. it becomes very prone to making errors either missing weak

Dr. James: making errors either missing weak making errors either missing weak signals or falsely detecting noise as a signals or falsely detecting noise as a signals or falsely detecting noise as a signal. signal.

Dr. James: signal. Which brings us to the next step in the Which brings us to the next step in the Which brings us to the next step in the evolution, the generalized energy evolution, the generalized energy

Sarah: evolution, the generalized energy detector or GED. This is where the madic detector or GED. This is where the madic

[click]

Dr. James: detector or GED. This is where the madic gets a bit more flexible. Right? gets a bit more flexible. Right? gets a bit more flexible. Right? It does. And this is where the paper

Sarah: It does. And this is where the paper It does. And this is where the paper really starts to dig in. GED builds on really starts to dig in. GED builds on really starts to dig in. GED builds on ED but makes one key change. Instead of

Sarah: ED but makes one key change. Instead of ED but makes one key change. Instead of just squaring the received signal just squaring the received signal just squaring the received signal amplitude, amplitude,

Sarah: amplitude, which is effectively raising it to the

[click]

Dr. James: which is effectively raising it to the which is effectively raising it to the power of two, power of two, power of two, right? The GED replaces that fixed power right? The GED replaces that fixed power

Dr. James: right? The GED replaces that fixed power of two with an arbitrary positive of two with an arbitrary positive

Sarah: of two with an arbitrary positive exponent which they call P. So it's

[click]

Dr. James: exponent which they call P. So it's

Sarah: exponent which they call P. So it's sometimes called a P norm detector.

[click]

Dr. James: sometimes called a P norm detector.

Sarah: sometimes called a P norm detector. So the standard ED is just a GED where

[click]

Dr. James: So the standard ED is just a GED where

Sarah: So the standard ED is just a GED where P2 P2 P2 precisely. And the big deal is this precisely. And the big deal is this precisely. And the big deal is this flexibility in P. Previous research flexibility in P. Previous research

Sarah: flexibility in P. Previous research which this paper acknowledges found that

[click]

Dr. James: which this paper acknowledges found that which this paper acknowledges found that choosing a different P maybe 1.5 or 2.5 choosing a different P maybe 1.5 or 2.5

Sarah: choosing a different P maybe 1.5 or 2.5 or 3.3 could actually improve detection or 3.3 could actually improve detection or 3.3 could actually improve detection performance in certain situations performance in certain situations

Sarah: performance in certain situations compared to just using P2. compared to just using P2.

[click]

Dr. James: compared to just using P2. Huh. So just tweaking that exponent Huh. So just tweaking that exponent Huh. So just tweaking that exponent gives you a potential advantage. How gives you a potential advantage. How

[click]

Dr. James: gives you a potential advantage. How does that work intuitively? Why would does that work intuitively? Why would does that work intuitively? Why would raising the signal to the power of say raising the signal to the power of say

Dr. James: raising the signal to the power of say three instead of two help? three instead of two help? three instead of two help? That's a really good question. It

Sarah: That's a really good question. It That's a really good question. It changes how the detector weighs changes how the detector weighs changes how the detector weighs different parts of the signal energy.

Sarah: different parts of the signal energy. different parts of the signal energy. Think about it. Squaring P2 gives Think about it. Squaring P2 gives Think about it. Squaring P2 gives emphasis proportional to the signal

Sarah: emphasis proportional to the signal emphasis proportional to the signal strength. A higher P like P3 gives much strength. A higher P like P3 gives much strength. A higher P like P3 gives much more weight to the stronger parts of the

Sarah: more weight to the stronger parts of the more weight to the stronger parts of the signal and relatively less weight to the signal and relatively less weight to the signal and relatively less weight to the weaker parts.

Sarah: weaker parts.

[click]

Dr. James: weaker parts. Okay? So imagine you have a primary Okay? So imagine you have a primary Okay? So imagine you have a primary signal that's very bursty, short, strong

Sarah: signal that's very bursty, short, strong signal that's very bursty, short, strong pulses. A higher P might help the pulses. A higher P might help the pulses. A higher P might help the detector lock onto those strong peaks

Sarah: detector lock onto those strong peaks detector lock onto those strong peaks more effectively and distinguish them more effectively and distinguish them more effectively and distinguish them from lower level steadier noise.

Sarah: from lower level steadier noise. from lower level steadier noise. Ah, I see. It emphasizes the peaks. Ah, I see. It emphasizes the peaks. Ah, I see. It emphasizes the peaks. Or conversely, maybe a different P

Sarah: Or conversely, maybe a different P Or conversely, maybe a different P value, perhaps less than two, might be value, perhaps less than two, might be value, perhaps less than two, might be better for detecting very weak but

Sarah: better for detecting very weak but better for detecting very weak but persistent signals buried in certain persistent signals buried in certain persistent signals buried in certain types of noise. It gives engineers a

Sarah: types of noise. It gives engineers a types of noise. It gives engineers a tuning knob. essentially tuning knob. essentially tuning knob. essentially a way to tailor the detector's a way to tailor the detector's

Sarah: a way to tailor the detector's sensitivity profile to the specific sensitivity profile to the specific sensitivity profile to the specific signal or noise characteristics they signal or noise characteristics they

[click]

Sarah: signal or noise characteristics they expect. expect. expect. Exactly. That adaptability is what makes Exactly. That adaptability is what makes Exactly. That adaptability is what makes GED potentially more powerful than the

Sarah: GED potentially more powerful than the GED potentially more powerful than the simple fixed ED, especially when simple fixed ED, especially when simple fixed ED, especially when conditions get tough. conditions get tough.

Dr. James: conditions get tough. All right, let's talk about one of those All right, let's talk about one of those All right, let's talk about one of those tough conditions in more detail. Noise tough conditions in more detail. Noise

Dr. James: tough conditions in more detail. Noise uncertainty and you it sounds like a uncertainty and you it sounds like a uncertainty and you it sounds like a really fundamental problem. really fundamental problem.

Dr. James: really fundamental problem. It is. In theory, we assume we know the It is. In theory, we assume we know the It is. In theory, we assume we know the background noise level perfectly, but in background noise level perfectly, but in

Dr. James: background noise level perfectly, but in reality, that noise floor is constantly reality, that noise floor is constantly reality, that noise floor is constantly shifting. shifting. shifting. Why? What causes it to be so uncertain?

Dr. James: Why? What causes it to be so uncertain? Why? What causes it to be so uncertain? It's a combination of things really. The

[click]

Sarah: It's a combination of things really. The

Dr. James: It's a combination of things really. The paper points out a few key sources. paper points out a few key sources. paper points out a few key sources. You've got um tiny calibration errors in You've got um tiny calibration errors in

Dr. James: You've got um tiny calibration errors in the receiver hardware itself. Nothing's the receiver hardware itself. Nothing's the receiver hardware itself. Nothing's perfect. perfect. perfect. Then there's natural thermal noise, the

Dr. James: Then there's natural thermal noise, the Then there's natural thermal noise, the random jiggling of electrons in the random jiggling of electrons in the random jiggling of electrons in the components, which changes with

Dr. James: components, which changes with components, which changes with temperature, temperature, temperature, right? Basic physics. Then a big one, right? Basic physics. Then a big one, right? Basic physics. Then a big one, variations in the gain of the low-noise

Dr. James: variations in the gain of the low-noise

[click]

Sarah: variations in the gain of the low-noise amplifier, the LNA. That's the first amplifier, the LNA. That's the first amplifier, the LNA. That's the first stage amplifying the really weak stage amplifying the really weak

Sarah: stage amplifying the really weak incoming signal. If it's amplification incoming signal. If it's amplification incoming signal. If it's amplification fluctuates even slightly, fluctuates even slightly,

Sarah: fluctuates even slightly, it changes the perceived noise level it changes the perceived noise level it changes the perceived noise level significantly. significantly. significantly. Exactly. And on top of all that, you

Sarah: Exactly. And on top of all that, you Exactly. And on top of all that, you have environmental noise interference have environmental noise interference have environmental noise interference from other devices, other transmissions,

Sarah: from other devices, other transmissions, from other devices, other transmissions, atmospheric noise, which is inherently atmospheric noise, which is inherently atmospheric noise, which is inherently dynamic.

Sarah: dynamic.

Dr. James: dynamic. So it's not just a steady hiss, it's a

[click]

Sarah: So it's not just a steady hiss, it's a

Dr. James: So it's not just a steady hiss, it's a complex, fluctuating background you're complex, fluctuating background you're complex, fluctuating background you're trying to detect a signal against. trying to detect a signal against.

Dr. James: trying to detect a signal against. Precisely. And that makes setting that Precisely. And that makes setting that Precisely. And that makes setting that decision threshold for the energy decision threshold for the energy

Dr. James: decision threshold for the energy detector incredibly difficult. If the detector incredibly difficult. If the detector incredibly difficult. If the noise floor itself is moving up and

[click]

Sarah: noise floor itself is moving up and noise floor itself is moving up and down, where you set the bar to reliably

Dr. James: down, where you set the bar to reliably down, where you set the bar to reliably catch a real signal without constantly catch a real signal without constantly catch a real signal without constantly getting false alarms from noise spikes.

Dr. James: getting false alarms from noise spikes. getting false alarms from noise spikes. It sounds like trying to measure ripples It sounds like trying to measure ripples It sounds like trying to measure ripples on the surface of a choppy sea.

Dr. James: on the surface of a choppy sea.

[click]

Sarah: on the surface of a choppy sea. That's a good way to put it. Even if you That's a good way to put it. Even if you That's a good way to put it. Even if you sense for a really long time collect sense for a really long time collect

Sarah: sense for a really long time collect tons of data samples, this uncertainty tons of data samples, this uncertainty tons of data samples, this uncertainty limits your ability to make a confident limits your ability to make a confident

[click]

Sarah: limits your ability to make a confident decision. And this difficulty, this decision. And this difficulty, this decision. And this difficulty, this fundamental limit imposed by NU leads fundamental limit imposed by NU leads

Sarah: fundamental limit imposed by NU leads directly to this concept of the SNR directly to this concept of the SNR directly to this concept of the SNR wall. wall. wall. Yes, the SNR wall is a direct Yes, the SNR wall is a direct

Sarah: Yes, the SNR wall is a direct consequence of noise uncertainty. It consequence of noise uncertainty. It consequence of noise uncertainty. It represents a specific signal to noise represents a specific signal to noise

Sarah: represents a specific signal to noise ratio value. Below this value, ratio value. Below this value, ratio value. Below this value, things break down things break down things break down completely. Below the SNR wall, you

Sarah: completely. Below the SNR wall, you completely. Below the SNR wall, you simply cannot achieve your desired simply cannot achieve your desired simply cannot achieve your desired detection performance. Say perfect

Sarah: detection performance. Say perfect detection performance. Say perfect detection with zero false alarms, no detection with zero false alarms, no detection with zero false alarms, no matter how long you sense for, even with

Sarah: matter how long you sense for, even with matter how long you sense for, even with infinite sensing time, infinite samples. infinite sensing time, infinite samples.

Dr. James: infinite sensing time, infinite samples. Wow. So, it's not just about collecting

[click]

Sarah: Wow. So, it's not just about collecting

Dr. James: Wow. So, it's not just about collecting more data. There's a point where if the more data. There's a point where if the more data. There's a point where if the signal is too weak relative to the signal is too weak relative to the

Dr. James: signal is too weak relative to the uncertainty in the noise, detection uncertainty in the noise, detection

[click]

Sarah: uncertainty in the noise, detection becomes fundamentally impossible. becomes fundamentally impossible. becomes fundamentally impossible. That's exactly it. It's a hard limit That's exactly it. It's a hard limit

Sarah: That's exactly it. It's a hard limit imposed by the physics of the situation imposed by the physics of the situation imposed by the physics of the situation and the imperfection of our knowledge and the imperfection of our knowledge

Sarah: and the imperfection of our knowledge about the noise. Think of it as a about the noise. Think of it as a about the noise. Think of it as a fundamental sensitivity floor, fundamental sensitivity floor,

Sarah: fundamental sensitivity floor, a true wall. a true wall. a true wall. And here's the critical thing that shows And here's the critical thing that shows And here's the critical thing that shows just how impactful noise uncertainty is.

Sarah: just how impactful noise uncertainty is. just how impactful noise uncertainty is. If there were no noise uncertainty, if If there were no noise uncertainty, if If there were no noise uncertainty, if you knew the noise level perfectly, the

Sarah: you knew the noise level perfectly, the you knew the noise level perfectly, the SNR wall wouldn't exist. SNR wall wouldn't exist.

Dr. James: SNR wall wouldn't exist. Really? Really? Really? Yes. Without NU, you could theoretically

[click]

Sarah: Yes. Without NU, you could theoretically Yes. Without NU, you could theoretically detect any signal, no matter how weak, detect any signal, no matter how weak, detect any signal, no matter how weak, as long as its SNR is above zero, just

Sarah: as long as its SNR is above zero, just as long as its SNR is above zero, just by sensing for long enough. The wall by sensing for long enough. The wall by sensing for long enough. The wall only appears because of the noise

Sarah: only appears because of the noise only appears because of the noise uncertainty. uncertainty. uncertainty. That really highlights it. NU isn't just That really highlights it. NU isn't just That really highlights it. NU isn't just a nuisance. It creates a fundamental

Sarah: a nuisance. It creates a fundamental a nuisance. It creates a fundamental barrier to reliable detection in low SR barrier to reliable detection in low SR

Dr. James: barrier to reliable detection in low SR scenarios. Okay, so noise uncertainty is scenarios. Okay, so noise uncertainty is scenarios. Okay, so noise uncertainty is a major hurdle creating this SNR wall.

Dr. James: a major hurdle creating this SNR wall. a major hurdle creating this SNR wall. But wireless signals face other gremlins But wireless signals face other gremlins But wireless signals face other gremlins too, right? We mentioned fading and

Dr. James: too, right? We mentioned fading and too, right? We mentioned fading and shadowing earlier. Can we quickly recap shadowing earlier. Can we quickly recap shadowing earlier. Can we quickly recap those? those?

Dr. James: those? Sure. Multiath fading is when the signal Sure. Multiath fading is when the signal Sure. Multiath fading is when the signal takes multiple paths to reach the takes multiple paths to reach the takes multiple paths to reach the receiver, bouncing off buildings, hills,

Dr. James: receiver, bouncing off buildings, hills, receiver, bouncing off buildings, hills, whatever. These paths have different whatever. These paths have different whatever. These paths have different lengths, so the signals arrive slightly

Dr. James: lengths, so the signals arrive slightly lengths, so the signals arrive slightly out of sync out of sync out of sync and they can interfere with each other. and they can interfere with each other. and they can interfere with each other. Right? Sometimes they add up

Dr. James: Right? Sometimes they add up Right? Sometimes they add up constructively, making the signal constructively, making the signal constructively, making the signal strong. Other times they cancel each strong. Other times they cancel each

Dr. James: strong. Other times they cancel each other out destructively causing a deep other out destructively causing a deep other out destructively causing a deep fade, a sudden drop in signal strength. fade, a sudden drop in signal strength.

Dr. James: fade, a sudden drop in signal strength. And shadowing. And shadowing. And shadowing. Shadowing is more about large obstacles. Shadowing is more about large obstacles. Shadowing is more about large obstacles. A big building, a dense forest, a hill

Dr. James: A big building, a dense forest, a hill A big building, a dense forest, a hill physically blocking the signal path. It physically blocking the signal path. It physically blocking the signal path. It causes slower, larger scale drops in

Dr. James: causes slower, larger scale drops in causes slower, larger scale drops in signal strength over an area. Like when signal strength over an area. Like when signal strength over an area. Like when your cell signal disappears as you drive

Dr. James: your cell signal disappears as you drive your cell signal disappears as you drive behind a big structure. behind a big structure. behind a big structure. And relying on just one antenna, one And relying on just one antenna, one

[click]

Dr. James: And relying on just one antenna, one receiver makes you vulnerable to both of receiver makes you vulnerable to both of receiver makes you vulnerable to both of these. these. these. Extremely vulnerable. If that single

Dr. James: Extremely vulnerable. If that single Extremely vulnerable. If that single antenna happens to be in a deep fade antenna happens to be in a deep fade antenna happens to be in a deep fade spot or behind a shadowing obstacle,

Dr. James: spot or behind a shadowing obstacle, spot or behind a shadowing obstacle, your signal is gone regardless of how your signal is gone regardless of how your signal is gone regardless of how good your detector is.

Dr. James: good your detector is. good your detector is. So, you need some way to increase

[click]

Sarah: So, you need some way to increase

Dr. James: So, you need some way to increase resilience, teamwork, maybe. resilience, teamwork, maybe.

[click]

Sarah: resilience, teamwork, maybe. Exactly. That's where diversity schemes Exactly. That's where diversity schemes Exactly. That's where diversity schemes come in. The basic idea is to use come in. The basic idea is to use

Sarah: come in. The basic idea is to use multiple receive paths, usually multiple multiple receive paths, usually multiple multiple receive paths, usually multiple antennas spaced apart to get independent antennas spaced apart to get independent

Sarah: antennas spaced apart to get independent looks at the signal. looks at the signal.

Dr. James: looks at the signal. So, if one antenna is in a bad spot,

[click]

Sarah: So, if one antenna is in a bad spot,

Dr. James: So, if one antenna is in a bad spot, hopefully another one isn't. It's about

[click]

Sarah: hopefully another one isn't. It's about hopefully another one isn't. It's about not putting all your eggs in one basket. not putting all your eggs in one basket. not putting all your eggs in one basket. It provides redundancy and makes the

Sarah: It provides redundancy and makes the It provides redundancy and makes the overall reception much more robust overall reception much more robust overall reception much more robust against these channel impairments.

Sarah: against these channel impairments.

Dr. James: against these channel impairments. Makes sense. So the paper looks at Makes sense. So the paper looks at Makes sense. So the paper looks at combining these diversity ideas with the combining these diversity ideas with the

Dr. James: combining these diversity ideas with the generalized energy detector. What were generalized energy detector. What were generalized energy detector. What were the two main schemes they investigated? the two main schemes they investigated?

[click]

Dr. James: the two main schemes they investigated? They looked at two primary approaches. They looked at two primary approaches. They looked at two primary approaches. Paw combining or PLC diversity and P law Paw combining or PLC diversity and P law

Dr. James: Paw combining or PLC diversity and P law selection or PLS diversity. selection or PLS diversity. selection or PLS diversity. Okay. PLC first. How does combining Okay. PLC first. How does combining Okay. PLC first. How does combining work? With PLC, you take the decision

Dr. James: work? With PLC, you take the decision work? With PLC, you take the decision statistic, the energy value calculated statistic, the energy value calculated statistic, the energy value calculated using the exponent P from each of your

Dr. James: using the exponent P from each of your using the exponent P from each of your diversity branches, each antenna. Then diversity branches, each antenna. Then diversity branches, each antenna. Then you simply add them all together,

Dr. James: you simply add them all together, you simply add them all together, summing up the energy readings from all summing up the energy readings from all summing up the energy readings from all antennas antennas

Sarah: antennas essentially. Yes. The final decision essentially. Yes. The final decision essentially. Yes. The final decision signal present or absent is based on signal present or absent is based on signal present or absent is based on this combined sum statistic. It's like

Sarah: this combined sum statistic. It's like this combined sum statistic. It's like pooling all the information together pooling all the information together pooling all the information together like everyone on the team contributing

Sarah: like everyone on the team contributing like everyone on the team contributing their piece of evidence and you make a their piece of evidence and you make a their piece of evidence and you make a decision based on the total weight of

Sarah: decision based on the total weight of decision based on the total weight of evidence. That's a good analogy. It evidence. That's a good analogy. It evidence. That's a good analogy. It leverages information from all paths.

Sarah: leverages information from all paths. leverages information from all paths. Okay. And the other one, PLS POW Okay. And the other one, PLS POW

[click]

Dr. James: Okay. And the other one, PLS POW selection. How is that different? selection. How is that different? selection. How is that different? PLS is simpler in a way. Instead of PLS is simpler in a way. Instead of

Dr. James: PLS is simpler in a way. Instead of adding everything up, you just look at adding everything up, you just look at adding everything up, you just look at the decision statistics from all the the decision statistics from all the

Dr. James: the decision statistics from all the branches and pick the maximum one. branches and pick the maximum one.

Sarah: branches and pick the maximum one. So, you find the antenna that's getting

[click]

Dr. James: So, you find the antenna that's getting

Sarah: So, you find the antenna that's getting the strongest signal reading at that the strongest signal reading at that

[click]

Dr. James: the strongest signal reading at that moment and base your decision solely on moment and base your decision solely on moment and base your decision solely on that one. that one.

Sarah: that one. That's right. You just select the best That's right. You just select the best That's right. You just select the best performer among the branches and ignore performer among the branches and ignore

[click]

Sarah: performer among the branches and ignore the others for that decision instant. the others for that decision instant. the others for that decision instant. Interesting. That's like listening to Interesting. That's like listening to

Sarah: Interesting. That's like listening to several people talking in a noisy room several people talking in a noisy room several people talking in a noisy room and just focusing on the loudest, and just focusing on the loudest,

[click]

Dr. James: and just focusing on the loudest, clearest voice. Exactly. So both PLC and clearest voice. Exactly. So both PLC and clearest voice. Exactly. So both PLC and PLS use multiple antennas to improve PLS use multiple antennas to improve

Dr. James: PLS use multiple antennas to improve performance, but they do it very performance, but they do it very performance, but they do it very differently. PLC aggregates PLS selects differently. PLC aggregates PLS selects

[click]

Dr. James: differently. PLC aggregates PLS selects the best. Understanding which one works the best. Understanding which one works the best. Understanding which one works better under which conditions is a key better under which conditions is a key

Dr. James: better under which conditions is a key part of the paper's investigation. part of the paper's investigation. part of the paper's investigation. Okay, let's get into those findings now. Okay, let's get into those findings now.

[click]

Dr. James: Okay, let's get into those findings now. The paper really dissected the SNR wall, The paper really dissected the SNR wall, The paper really dissected the SNR wall, starting with that simpler AWGN channel

Dr. James: starting with that simpler AWGN channel

[click]

Sarah: starting with that simpler AWGN channel model, but importantly still including model, but importantly still including model, but importantly still including noise uncertainty. What did they find noise uncertainty. What did they find

[click]

Dr. James: noise uncertainty. What did they find for a single receiver? No diversity, for a single receiver? No diversity, for a single receiver? No diversity, right? So just one antenna, AWGN noise, right? So just one antenna, AWGN noise,

Dr. James: right? So just one antenna, AWGN noise, but with that pesky noise uncertainty but with that pesky noise uncertainty but with that pesky noise uncertainty and you and you and you they derived a mathematical formula for

Dr. James: they derived a mathematical formula for

Sarah: they derived a mathematical formula for the SNR wall. And the key finding was uh the SNR wall. And the key finding was uh the SNR wall. And the key finding was uh perhaps a bit surprising, perhaps a bit surprising,

Sarah: perhaps a bit surprising, which was

[click]

Dr. James: which was which was the SNR wall in this single receiver the SNR wall in this single receiver the SNR wall in this single receiver case is completely independent of the P case is completely independent of the P

Dr. James: case is completely independent of the P value in the generalized energy value in the generalized energy value in the generalized energy detector. detector. detector. Wow. So fiddling with P doesn't help you

Dr. James: Wow. So fiddling with P doesn't help you Wow. So fiddling with P doesn't help you overcome the wall if you only have one overcome the wall if you only have one overcome the wall if you only have one antenna. Whether you use P2 or P3 or

Dr. James: antenna. Whether you use P2 or P3 or antenna. Whether you use P2 or P3 or whatever, the fundamental limit set by whatever, the fundamental limit set by whatever, the fundamental limit set by NU stays the same.

Dr. James: NU stays the same. NU stays the same. Exactly. The formula they derived 10 L

Sarah: Exactly. The formula they derived 10 L Exactly. The formula they derived 10 L 10 hounds where L is the noise 10 hounds where L is the noise 10 hounds where L is the noise uncertainty in DB shows the wall depends

Sarah: uncertainty in DB shows the wall depends uncertainty in DB shows the wall depends only on L the level of uncertainty not only on L the level of uncertainty not only on L the level of uncertainty not on P. If L is zero, no uncertainty, the

Sarah: on P. If L is zero, no uncertainty, the on P. If L is zero, no uncertainty, the wall is zero SNR, meaning perfect wall is zero SNR, meaning perfect wall is zero SNR, meaning perfect detection is possible. But any

Sarah: detection is possible. But any detection is possible. But any uncertainty L0 creates a wall and P uncertainty L0 creates a wall and P uncertainty L0 creates a wall and P can't tear it down.

[click]

Dr. James: can't tear it down. can't tear it down. Okay, that's clear. But what happens

Sarah: Okay, that's clear. But what happens

[click]

Dr. James: Okay, that's clear. But what happens when you bring in diversity? Let's start when you bring in diversity? Let's start when you bring in diversity? Let's start with PLC, the combining scheme. Does with PLC, the combining scheme. Does

Dr. James: with PLC, the combining scheme. Does that change things? that change things? that change things? It does, but it depends. The analysis It does, but it depends. The analysis It does, but it depends. The analysis gets more complex, especially if the

Dr. James: gets more complex, especially if the gets more complex, especially if the noise uncertainty L or the average SNR

Sarah: noise uncertainty L or the average SNR noise uncertainty L or the average SNR is different at each antenna, which is

[click]

Dr. James: is different at each antenna, which is is different at each antenna, which is realistic. realistic. realistic. So, what did they find in those cases? So, what did they find in those cases? So, what did they find in those cases? Two main things. First, if you have a

Dr. James: Two main things. First, if you have a Two main things. First, if you have a homogeneous setup, meaning all antennas homogeneous setup, meaning all antennas homogeneous setup, meaning all antennas experience the same noise uncertainty,

Dr. James: experience the same noise uncertainty, experience the same noise uncertainty, L1 L2L, and the same average SNR, then L1 L2L, and the same average SNR, then L1 L2L, and the same average SNR, then the SNR wall is still the same as the no

Dr. James: the SNR wall is still the same as the no

Sarah: the SNR wall is still the same as the no diversity case, and it's still diversity case, and it's still

[click]

Dr. James: diversity case, and it's still independent of P. So just combining independent of P. So just combining independent of P. So just combining identical inputs doesn't magically make identical inputs doesn't magically make

[click]

Dr. James: identical inputs doesn't magically make EP matter for the wall itself. EP matter for the wall itself. EP matter for the wall itself. Not for the wall location. No, the

Sarah: Not for the wall location. No, the Not for the wall location. No, the combining still helps fight fading, but combining still helps fight fading, but combining still helps fight fading, but doesn't change the fundamental pain

Dr. James: doesn't change the fundamental pain doesn't change the fundamental pain independence of the NU induced wall in independence of the NU induced wall in independence of the NU induced wall in this specific scenario.

Dr. James: this specific scenario. this specific scenario. But what about the more realistic But what about the more realistic But what about the more realistic heterogeneous case where the SNRs are heterogeneous case where the SNRs are

[click]

Dr. James: heterogeneous case where the SNRs are different at each antenna? different at each antenna? different at each antenna? Uh, now it gets interesting. This is a

[click]

Sarah: Uh, now it gets interesting. This is a Uh, now it gets interesting. This is a huge finding. When the SNRs differ huge finding. When the SNRs differ huge finding. When the SNRs differ across branches, the SNR wall does

Sarah: across branches, the SNR wall does across branches, the SNR wall does become dependent on the value of P. become dependent on the value of P.

Dr. James: become dependent on the value of P. Really? So P suddenly matters. Really? So P suddenly matters. Really? So P suddenly matters. Yes. And crucially, they found that

[click]

Sarah: Yes. And crucially, they found that Yes. And crucially, they found that increasing the value of P when using PLC increasing the value of P when using PLC increasing the value of P when using PLC diversity with unequal SNRs can actually

Sarah: diversity with unequal SNRs can actually diversity with unequal SNRs can actually lower the SNR wall. lower the SNR wall. lower the SNR wall. Lowering the wall means better Lowering the wall means better

Dr. James: Lowering the wall means better performance, right? You can detect performance, right? You can detect performance, right? You can detect weaker signals reliably. weaker signals reliably. weaker signals reliably. Exactly. A lower wall is always better.

Sarah: Exactly. A lower wall is always better. Exactly. A lower wall is always better. It means you need less signal strength It means you need less signal strength It means you need less signal strength to achieve that unlimited reliability.

Sarah: to achieve that unlimited reliability.

Dr. James: to achieve that unlimited reliability. Can you give an example? How much Can you give an example? How much Can you give an example? How much difference can P make here? difference can P make here? difference can P make here? The paper gives a numerical example. Two

Dr. James: The paper gives a numerical example. Two The paper gives a numerical example. Two branches both with L1 dB noise branches both with L1 dB noise branches both with L1 dB noise uncertainty. Let's say branch 2 has a

Dr. James: uncertainty. Let's say branch 2 has a uncertainty. Let's say branch 2 has a low SNR bellow.1. low SNR bellow.1. low SNR bellow.1. To achieve unlimited reliability, the To achieve unlimited reliability, the

Dr. James: To achieve unlimited reliability, the required SNR on branch one, which is the required SNR on branch one, which is the required SNR on branch one, which is the wall in this context, decreased as P wall in this context, decreased as P

Dr. James: wall in this context, decreased as P increased. For P1, you needed gull increased. For P1, you needed gull increased. For P1, you needed gull 1.8914, but for PP5, you only needed 1.8914, but for PP5, you only needed

Dr. James: 1.8914, but for PP5, you only needed gull 1.7153. gull 1.7153.

[click]

Sarah: gull 1.7153. That's a reduction of almost 1 dB. That's a reduction of almost 1 dB. That's a reduction of almost 1 dB. That's significant in wireless terms. That's significant in wireless terms. That's significant in wireless terms. It really is. It shows that with PLC, if

Sarah: It really is. It shows that with PLC, if It really is. It shows that with PLC, if you have at least one branch with a you have at least one branch with a you have at least one branch with a decent signal, even if others are weak,

Sarah: decent signal, even if others are weak, decent signal, even if others are weak, optimizing P helps you leverage that optimizing P helps you leverage that optimizing P helps you leverage that good branch more effectively to overcome

Sarah: good branch more effectively to overcome good branch more effectively to overcome the wall. the wall. the wall. Okay, that's powerful for PLC. What Okay, that's powerful for PLC. What

Dr. James: Okay, that's powerful for PLC. What about PLS? The selection diversity where about PLS? The selection diversity where about PLS? The selection diversity where you just pick the best signal. How does you just pick the best signal. How does

Dr. James: you just pick the best signal. How does the wall behave there? the wall behave there? the wall behave there? For PLS, the finding was simpler. The For PLS, the finding was simpler. The For PLS, the finding was simpler. The SNR wall is independent of P, just like

Dr. James: SNR wall is independent of P, just like SNR wall is independent of P, just like the no diversity case. the no diversity case. the no diversity case. So, no benefit from tuning P with

[click]

Sarah: So, no benefit from tuning P with

Dr. James: So, no benefit from tuning P with selection diversity when it comes to the selection diversity when it comes to the selection diversity when it comes to the wall. Correct. But PLS has a different wall. Correct. But PLS has a different

Dr. James: wall. Correct. But PLS has a different kind of advantage. For unlimited kind of advantage. For unlimited kind of advantage. For unlimited reliability with PLS, you only need the reliability with PLS, you only need the

[click]

Dr. James: reliability with PLS, you only need the SNR at any single branch to be above its SNR at any single branch to be above its SNR at any single branch to be above its own SNR wall. own SNR wall.

[click]

Sarah: own SNR wall. Ah, it's an or condition, not an add. So

Dr. James: Ah, it's an or condition, not an add. So

[click]

Sarah: Ah, it's an or condition, not an add. So if antenna 1 has SNR above its wall or if antenna 1 has SNR above its wall or if antenna 1 has SNR above its wall or antenna 2 has SNR above its wall, you're antenna 2 has SNR above its wall, you're

Sarah: antenna 2 has SNR above its wall, you're good. good. good. Exactly. Using their example, if L1.5 dB Exactly. Using their example, if L1.5 dB Exactly. Using their example, if L1.5 dB wall, wall 23, and L2.319,

Sarah: wall, wall 23, and L2.319, wall, wall 23, and L2.319, you just need either over 23 or 0.23 you just need either over 23 or 0.23 you just need either over 23 or 0.23 or well 4.19. or well 4.19.

Dr. James: or well 4.19. That sounds incredibly resilient. That sounds incredibly resilient. That sounds incredibly resilient. One good antenna path can basically save

[click]

Sarah: One good antenna path can basically save One good antenna path can basically save the day even if the others are terrible. the day even if the others are terrible. the day even if the others are terrible. That's the key benefit of PLS. It's

Sarah: That's the key benefit of PLS. It's That's the key benefit of PLS. It's robust because it only relies on the robust because it only relies on the robust because it only relies on the best instantaneous condition available

Sarah: best instantaneous condition available best instantaneous condition available across all branches. across all branches. across all branches. Okay, that covers the AWGN case. Now, Okay, that covers the AWGN case. Now,

Dr. James: Okay, that covers the AWGN case. Now, let's make it even more real by adding let's make it even more real by adding let's make it even more real by adding fading. They use the Nakagami fading fading. They use the Nakagami fading

[click]

Dr. James: fading. They use the Nakagami fading model, right? model, right? model, right? Yes. Nakagami fading, which is quite

Sarah: Yes. Nakagami fading, which is quite Yes. Nakagami fading, which is quite general and can represent various general and can represent various general and can represent various environments from mild to severe fading.

Sarah: environments from mild to severe fading.

[click]

Dr. James: environments from mild to severe fading. So you got noise uncertainty A and D

Sarah: So you got noise uncertainty A and D

[click]

Dr. James: So you got noise uncertainty A and D fading. Now what does that do to the SNR fading. Now what does that do to the SNR fading. Now what does that do to the SNR wall? wall? wall? It makes it significantly worse. The

Dr. James: It makes it significantly worse. The It makes it significantly worse. The paper shows that when you consider both paper shows that when you consider both paper shows that when you consider both NU and fading, the SNR wall increases

Dr. James: NU and fading, the SNR wall increases NU and fading, the SNR wall increases substantially compared to the NU only substantially compared to the NU only substantially compared to the NU only case. case.

[click]

Dr. James: case. Meaning you need a much stronger signal Meaning you need a much stronger signal Meaning you need a much stronger signal to achieve reliable detection. to achieve reliable detection. to achieve reliable detection. Much stronger. Fading adds another layer

Dr. James: Much stronger. Fading adds another layer Much stronger. Fading adds another layer of difficulty on top of the uncertainty. of difficulty on top of the uncertainty. of difficulty on top of the uncertainty. And interestingly, they noted that for

Dr. James: And interestingly, they noted that for And interestingly, they noted that for fading channels, they couldn't find a fading channels, they couldn't find a fading channels, they couldn't find a neat mathematical formula for the wall.

Dr. James: neat mathematical formula for the wall. neat mathematical formula for the wall. They had to rely on numerical They had to rely on numerical They had to rely on numerical simulations to find its value. simulations to find its value.

Dr. James: simulations to find its value. Can you give us a number to illustrate Can you give us a number to illustrate Can you give us a number to illustrate how much worse it gets? how much worse it gets? how much worse it gets? Sure. For P2, L0.5DB

Dr. James: Sure. For P2, L0.5DB Sure. For P2, L0.5DB noise uncertainty and a moderate

Sarah: noise uncertainty and a moderate noise uncertainty and a moderate Nakagami fading parameter M2. The SNR Nakagami fading parameter M2. The SNR Nakagami fading parameter M2. The SNR wall without diversity jumped from 2308

Sarah: wall without diversity jumped from 2308 wall without diversity jumped from 2308 AWGN with NU to 1.841 fading with NU. AWGN with NU to 1.841 fading with NU. AWGN with NU to 1.841 fading with NU. Whoa, that's a huge jump. Almost eight

Dr. James: Whoa, that's a huge jump. Almost eight Whoa, that's a huge jump. Almost eight times higher in linear terms or over 8 times higher in linear terms or over 8 times higher in linear terms or over 8 dB. dB.

Sarah: dB. It's a very significant increase. Yes, It's a very significant increase. Yes, It's a very significant increase. Yes, around 9 dB actually. It highlights how around 9 dB actually. It highlights how around 9 dB actually. It highlights how much harder fading makes the detection

Sarah: much harder fading makes the detection much harder fading makes the detection problem, especially when coupled with problem, especially when coupled with problem, especially when coupled with noise uncertainty.

Sarah: noise uncertainty. noise uncertainty. But diversity still helps even in these But diversity still helps even in these But diversity still helps even in these really tough fading conditions. really tough fading conditions.

Sarah: really tough fading conditions. Oh, definitely. It's even more crucial Oh, definitely. It's even more crucial Oh, definitely. It's even more crucial here. For example, using PLC diversity here. For example, using PLC diversity

[click]

Sarah: here. For example, using PLC diversity with P2 LL0.5 dB M plus2 on both with P2 LL0.5 dB M plus2 on both with P2 LL0.5 dB M plus2 on both branches. The SNR wall came down to 0.67 branches. The SNR wall came down to 0.67

Sarah: branches. The SNR wall came down to 0.67 for each branch. for each branch. for each branch. Okay. 67 is still higher than the EWGN Okay. 67 is still higher than the EWGN Okay. 67 is still higher than the EWGN case, but much better than the

Sarah: case, but much better than the case, but much better than the 1.841 without diversity invading. 1.841 without diversity invading. 1.841 without diversity invading. Exactly. It shows diversity provides Exactly. It shows diversity provides

Sarah: Exactly. It shows diversity provides substantial gains pushing that wall down substantial gains pushing that wall down substantial gains pushing that wall down considerably even when facing both NU considerably even when facing both NU

Sarah: considerably even when facing both NU and fading. And for PLS and fading, the and fading. And for PLS and fading, the and fading. And for PLS and fading, the wall remained independent of P just like wall remained independent of P just like

Sarah: wall remained independent of P just like before. before. before. This is incredibly insightful about the This is incredibly insightful about the This is incredibly insightful about the fundamental limits. But the paper went

Sarah: fundamental limits. But the paper went

[click]

Dr. James: fundamental limits. But the paper went beyond just the wall, right? It looked beyond just the wall, right? It looked beyond just the wall, right? It looked at overall performance and offered at overall performance and offered

[click]

Dr. James: at overall performance and offered practical takeaways. What about the practical takeaways. What about the practical takeaways. What about the optimal P value for the GED in general optimal P value for the GED in general

Dr. James: optimal P value for the GED in general use? use? use? Yes, they looked at detection

Sarah: Yes, they looked at detection Yes, they looked at detection probability, not just the wall. And this probability, not just the wall. And this probability, not just the wall. And this is a key practical finding for

Dr. James: is a key practical finding for is a key practical finding for sufficiently high sample sizes N meaning sufficiently high sample sizes N meaning sufficiently high sample sizes N meaning you have a decent amount of sensing time

Dr. James: you have a decent amount of sensing time you have a decent amount of sensing time or data or data or data which you'd want in a real system which you'd want in a real system which you'd want in a real system right in that case the GED performs best

Sarah: right in that case the GED performs best

[click]

Dr. James: right in that case the GED performs best when P is close to two. So back to the when P is close to two. So back to the when P is close to two. So back to the standard energy detector standard energy detector

Dr. James: standard energy detector pretty much it suggests that while other pretty much it suggests that while other pretty much it suggests that while other P values might offer theoretical P values might offer theoretical

Dr. James: P values might offer theoretical advantages in specific niche cases or advantages in specific niche cases or advantages in specific niche cases or with very few samples as some older with very few samples as some older

Dr. James: with very few samples as some older research suggested once you have enough research suggested once you have enough research suggested once you have enough data the robustness of the P2 squaring data the robustness of the P2 squaring

Dr. James: data the robustness of the P2 squaring operation often wins out for overall operation often wins out for overall operation often wins out for overall performance. performance. performance. The simplifies things for designers

Dr. James: The simplifies things for designers The simplifies things for designers doesn't it? For many practical systems doesn't it? For many practical systems doesn't it? For many practical systems sticking with P2 might be the best bet.

Dr. James: sticking with P2 might be the best bet. sticking with P2 might be the best bet. It certainly suggests that yes, it It certainly suggests that yes, it

Sarah: It certainly suggests that yes, it implies the conventional ED is actually implies the conventional ED is actually implies the conventional ED is actually quite optimal when you can afford a quite optimal when you can afford a

Dr. James: quite optimal when you can afford a reasonable number of samples. reasonable number of samples. reasonable number of samples. Okay. What about comparing the two Okay. What about comparing the two Okay. What about comparing the two diversity schemes head-to-head? PLC

Dr. James: diversity schemes head-to-head? PLC diversity schemes head-to-head? PLC combining versus PLS selection. Which combining versus PLS selection. Which combining versus PLS selection. Which one generally performed better overall?

Dr. James: one generally performed better overall? one generally performed better overall? The results showed that PLC diversity, The results showed that PLC diversity, The results showed that PLC diversity, the combining method, generally performs

Dr. James: the combining method, generally performs the combining method, generally performs better than pls diversity, better than pls diversity, better than pls diversity, better detection probability. better detection probability.

[click]

Dr. James: better detection probability. Yes, they gave an example with P2 and

[click]

Sarah: Yes, they gave an example with P2 and Yes, they gave an example with P2 and N500 samples. PLC achieved about 30% N500 samples. PLC achieved about 30% N500 samples. PLC achieved about 30% higher detection probability than no

Sarah: higher detection probability than no higher detection probability than no diversity and crucially about 7.2% diversity and crucially about 7.2% diversity and crucially about 7.2% higher detection probability than pls

Sarah: higher detection probability than pls higher detection probability than pls under the same conditions. under the same conditions.

Dr. James: under the same conditions. So adding up the information from all

[click]

Sarah: So adding up the information from all

Dr. James: So adding up the information from all branches usually gives you a better branches usually gives you a better branches usually gives you a better result than just picking the best one. result than just picking the best one.

Dr. James: result than just picking the best one. Generally, yes. It seems that Generally, yes. It seems that Generally, yes. It seems that aggregating the energy provides a more aggregating the energy provides a more

Dr. James: aggregating the energy provides a more robust final statistic. robust final statistic. robust final statistic. But there was that interesting point But there was that interesting point

[click]

Sarah: But there was that interesting point about what happens with tons of data, about what happens with tons of data,

Dr. James: about what happens with tons of data, right? The asymtoic case. right? The asymtoic case. right? The asymtoic case. Yes, the aha moment. As the number of

[click]

Sarah: Yes, the aha moment. As the number of Yes, the aha moment. As the number of samples n goes towards infinity, samples n goes towards infinity, samples n goes towards infinity, which is theoretical but tells us about

Dr. James: which is theoretical but tells us about which is theoretical but tells us about fundamental limits. fundamental limits. fundamental limits. Exactly. As n gets extremely large, two

Sarah: Exactly. As n gets extremely large, two Exactly. As n gets extremely large, two things happen. First, the detection things happen. First, the detection things happen. First, the detection performance of the GED becomes

Sarah: performance of the GED becomes performance of the GED becomes independent of P. The choice of exponent independent of P. The choice of exponent independent of P. The choice of exponent doesn't matter anymore.

Dr. James: doesn't matter anymore. doesn't matter anymore. So P2, P3, whatever, they all converge.

[click]

Sarah: So P2, P3, whatever, they all converge.

Dr. James: So P2, P3, whatever, they all converge. They converge in performance. And They converge in performance. And They converge in performance. And second, the performance of both PLC and second, the performance of both PLC and

Dr. James: second, the performance of both PLC and PLS diversity schemes becomes almost the PLS diversity schemes becomes almost the PLS diversity schemes becomes almost the same. same. same. Wow. So with infinite data, it doesn't

Dr. James: Wow. So with infinite data, it doesn't Wow. So with infinite data, it doesn't matter if you combine or select and it matter if you combine or select and it matter if you combine or select and it doesn't matter what P you use.

Dr. James: doesn't matter what P you use. doesn't matter what P you use. Essentially, yes. The sheer amount of

[click]

Sarah: Essentially, yes. The sheer amount of Essentially, yes. The sheer amount of information dominates any subtle information dominates any subtle information dominates any subtle differences in the processing method. It

Sarah: differences in the processing method. It differences in the processing method. It implies that for systems that can implies that for systems that can implies that for systems that can integrate over very long times, the

Sarah: integrate over very long times, the integrate over very long times, the specific detector design choices become specific detector design choices become specific detector design choices become less critical.

Sarah: less critical. less critical. Fascinating. Now, maybe the biggest Fascinating. Now, maybe the biggest

Dr. James: Fascinating. Now, maybe the biggest takeaway described as a byproduct of takeaway described as a byproduct of takeaway described as a byproduct of their work comparing noise uncertainty their work comparing noise uncertainty

Dr. James: their work comparing noise uncertainty versus fading, which is the bigger versus fading, which is the bigger versus fading, which is the bigger villain. villain.

[click]

Sarah: villain. This is a really significant finding. This is a really significant finding. This is a really significant finding. They directly compared the impact of NU They directly compared the impact of NU

Sarah: They directly compared the impact of NU versus the impact of fading on the GED's versus the impact of fading on the GED's versus the impact of fading on the GED's performance, and the result might performance, and the result might

[click]

Dr. James: performance, and the result might challenge some long-held assumptions. challenge some long-held assumptions. challenge some long-held assumptions. How so? How so? How so? For certain levels of noise uncertainty,

Dr. James: For certain levels of noise uncertainty, For certain levels of noise uncertainty, its negative effect on detection its negative effect on detection

Sarah: its negative effect on detection performance is actually more severe than performance is actually more severe than performance is actually more severe than the effect of fading alone. the effect of fading alone.

Dr. James: the effect of fading alone. Really worse than fading. Fading gets so Really worse than fading. Fading gets so Really worse than fading. Fading gets so much attention in wireless design. much attention in wireless design.

[click]

Dr. James: much attention in wireless design. It does, but their ROC curve analysis It does, but their ROC curve analysis It does, but their ROC curve analysis showed it clearly. For instance, with showed it clearly. For instance, with

Dr. James: showed it clearly. For instance, with L.4 dB uncertainty, the detection L.4 dB uncertainty, the detection L.4 dB uncertainty, the detection probability was significantly lower, probability was significantly lower,

[click]

Dr. James: probability was significantly lower, around 21% lower at a P of 0.1 compared around 21% lower at a P of 0.1 compared around 21% lower at a P of 0.1 compared to having only fading present with M2. to having only fading present with M2.

Dr. James: to having only fading present with M2. That is a huge difference. It suggests That is a huge difference. It suggests That is a huge difference. It suggests maybe we haven't paid enough attention maybe we haven't paid enough attention

[click]

Dr. James: maybe we haven't paid enough attention to accurately characterizing and to accurately characterizing and to accurately characterizing and mitigating noise uncertainty. mitigating noise uncertainty.

[click]

Sarah: mitigating noise uncertainty. That's a strong implication. While That's a strong implication. While That's a strong implication. While fading is undeniably a problem, this fading is undeniably a problem, this

[click]

Sarah: fading is undeniably a problem, this research suggests that NU can be the research suggests that NU can be the

Dr. James: research suggests that NU can be the dominant limiting factor in some dominant limiting factor in some dominant limiting factor in some realistic scenarios. Ignoring it or realistic scenarios. Ignoring it or

Sarah: realistic scenarios. Ignoring it or assuming it's negligible could lead to assuming it's negligible could lead to assuming it's negligible could lead to designs that significantly underperform designs that significantly underperform

Sarah: designs that significantly underperform in the real world. in the real world. in the real world. And of course, performance is worse when And of course, performance is worse when And of course, performance is worse when you have both NU and fading together

Sarah: you have both NU and fading together you have both NU and fading together predictably. Yes, that's the toughest predictably. Yes, that's the toughest

[click]

Dr. James: predictably. Yes, that's the toughest but also the most realistic scenario. but also the most realistic scenario. but also the most realistic scenario. So the big implication here is

Sarah: So the big implication here is

[click]

Dr. James: So the big implication here is engineers really need to focus on engineers really need to focus on engineers really need to focus on understanding and mitigating noise understanding and mitigating noise

Sarah: understanding and mitigating noise uncertainty. It's not a secondary uncertainty. It's not a secondary uncertainty. It's not a secondary effect. It can be a primary bottleneck, effect. It can be a primary bottleneck,

Dr. James: effect. It can be a primary bottleneck, sometimes even more damaging than

Sarah: sometimes even more damaging than

[click]

Dr. James: sometimes even more damaging than fading. Techniques for better noise fading. Techniques for better noise fading. Techniques for better noise estimation, calibration, and designing estimation, calibration, and designing

Dr. James: estimation, calibration, and designing detectors robust to NU are critical for detectors robust to NU are critical for detectors robust to NU are critical for reliable cognitive radio and maybe reliable cognitive radio and maybe

[click]

Dr. James: reliable cognitive radio and maybe wireless systems in general. # tagoutro. wireless systems in general. # tagoutro. wireless systems in general. # tagoutro. Wow. Okay, we've covered a lot of ground Wow. Okay, we've covered a lot of ground

Dr. James: Wow. Okay, we've covered a lot of ground in this deep dive. from the fundamental in this deep dive. from the fundamental in this deep dive. from the fundamental problem of spectrum scarcity problem of spectrum scarcity

[click]

Dr. James: problem of spectrum scarcity to the elegant idea of cognitive radio to the elegant idea of cognitive radio to the elegant idea of cognitive radio trying to solve it trying to solve it trying to solve it then into the nitty-gritty of spectrum

Dr. James: then into the nitty-gritty of spectrum then into the nitty-gritty of spectrum sensing starting with basic energy sensing starting with basic energy sensing starting with basic energy detection detection

Dr. James: detection and evolving to the more flexible and evolving to the more flexible and evolving to the more flexible generalized energy detector and that generalized energy detector and that generalized energy detector and that interesting role of the P parameter

Dr. James: interesting role of the P parameter interesting role of the P parameter and then confronting that really and then confronting that really and then confronting that really challenging concept the SNR wall driven

Dr. James: challenging concept the SNR wall driven challenging concept the SNR wall driven primarily by noise uncertainty primarily by noise uncertainty primarily by noise uncertainty a fundamental limit. Yeah. But we also

Dr. James: a fundamental limit. Yeah. But we also a fundamental limit. Yeah. But we also saw how clever techniques like saw how clever techniques like saw how clever techniques like diversity, especially PLC combining, can

Dr. James: diversity, especially PLC combining, can diversity, especially PLC combining, can help us fight back against that wall help us fight back against that wall help us fight back against that wall even when facing both noise uncertainty

Dr. James: even when facing both noise uncertainty even when facing both noise uncertainty and difficult feeding conditions. and difficult feeding conditions.

Sarah: and difficult feeding conditions. So summing up the key takeaways, the

[click]

Dr. James: So summing up the key takeaways, the

Sarah: So summing up the key takeaways, the real headline messages from this real headline messages from this real headline messages from this research, research, research, I'd say first that surprising severity

Sarah: I'd say first that surprising severity I'd say first that surprising severity of noise uncertainty. It can be more of noise uncertainty. It can be more

[click]

Dr. James: of noise uncertainty. It can be more detrimental than fading sometimes, which detrimental than fading sometimes, which detrimental than fading sometimes, which really shifts the focus for designers. really shifts the focus for designers.

[click]

Dr. James: really shifts the focus for designers. Right. Second, the nuance story of the p

Sarah: Right. Second, the nuance story of the p Right. Second, the nuance story of the p value in GEDs optimal near two with value in GEDs optimal near two with value in GEDs optimal near two with enough data but ultimately becoming less

Sarah: enough data but ultimately becoming less enough data but ultimately becoming less important with massive data sets or when important with massive data sets or when important with massive data sets or when facing the SR wall alone.

Sarah: facing the SR wall alone. facing the SR wall alone. And third, the general performance And third, the general performance And third, the general performance advantage of combining diversity PLC advantage of combining diversity PLC

Sarah: advantage of combining diversity PLC over selection pls although both offer over selection pls although both offer over selection pls although both offer huge benefits over no diversity and huge benefits over no diversity and

Sarah: huge benefits over no diversity and osmotically they perform similarly. It osmotically they perform similarly. It osmotically they perform similarly. It really paints a picture of the complex really paints a picture of the complex

Sarah: really paints a picture of the complex interplay between signals, noise, interplay between signals, noise, interplay between signals, noise, uncertainty, and the clever engineering uncertainty, and the clever engineering

Sarah: uncertainty, and the clever engineering needed to make wireless communication needed to make wireless communication needed to make wireless communication reliable. reliable.

[click]

Dr. James: reliable. It absolutely does. It shows that It absolutely does. It shows that It absolutely does. It shows that pushing the boundaries of wireless pushing the boundaries of wireless pushing the boundaries of wireless communication isn't just about brute

Dr. James: communication isn't just about brute

Sarah: communication isn't just about brute force. It's about deeply understanding force. It's about deeply understanding force. It's about deeply understanding these fundamental limits and finding these fundamental limits and finding

[click]

Sarah: these fundamental limits and finding smart ways to work around them. smart ways to work around them.

[click]

Dr. James: smart ways to work around them. So, let's leave everyone with a final

Sarah: So, let's leave everyone with a final

[click]

Dr. James: So, let's leave everyone with a final thought to chew on. Given these thought to chew on. Given these thought to chew on. Given these findings, especially about noise findings, especially about noise findings, especially about noise uncertainty being such a major culprit,

Dr. James: uncertainty being such a major culprit, uncertainty being such a major culprit, what if engineers really crack the code what if engineers really crack the code what if engineers really crack the code on characterizing and mitigating NU more

Dr. James: on characterizing and mitigating NU more on characterizing and mitigating NU more effectively than we do now? effectively than we do now? effectively than we do now? That's an interesting question.

Sarah: That's an interesting question. That's an interesting question. Could that breakthrough unlock vast

[click]

Dr. James: Could that breakthrough unlock vast Could that breakthrough unlock vast amounts of spectrum that we currently amounts of spectrum that we currently amounts of spectrum that we currently consider unusable because the signals

Dr. James: consider unusable because the signals consider unusable because the signals are just too close to that uncertain are just too close to that uncertain are just too close to that uncertain noise floor? Could tackling NU be a key

Dr. James: noise floor? Could tackling NU be a key noise floor? Could tackling NU be a key enabler for say 6G or for making IoT enabler for say 6G or for making IoT enabler for say 6G or for making IoT truly ubiquitous and ultra reliable?

Dr. James: truly ubiquitous and ultra reliable? truly ubiquitous and ultra reliable? It's definitely plausible if you can

Sarah: It's definitely plausible if you can It's definitely plausible if you can effectively lower or manage that noise effectively lower or manage that noise effectively lower or manage that noise uncertainty L value we talked about. You

Sarah: uncertainty L value we talked about. You uncertainty L value we talked about. You directly lower the SNR wall that could directly lower the SNR wall that could directly lower the SNR wall that could potentially open up operation in regimes

Sarah: potentially open up operation in regimes potentially open up operation in regimes that are currently off limits, that are currently off limits, that are currently off limits, making our use of the spectrum even more

Sarah: making our use of the spectrum even more making our use of the spectrum even more efficient just by getting better at efficient just by getting better at efficient just by getting better at understanding the static.

Sarah: understanding the static. understanding the static. It's a compelling thought. Maybe the It's a compelling thought. Maybe the It's a compelling thought. Maybe the next big leap isn't just about fancier

Sarah: next big leap isn't just about fancier next big leap isn't just about fancier signals, but about truly mastering the signals, but about truly mastering the signals, but about truly mastering the noise.

Sarah: noise.

[click]

Dr. James: noise. What stood out to you listening to this? What stood out to you listening to this? What stood out to you listening to this? Did you have any aha moments about this Did you have any aha moments about this

Dr. James: Did you have any aha moments about this invisible world? We'd love to hear them. invisible world? We'd love to hear them. invisible world? We'd love to hear them. Thanks for joining us on the deep dive.

-->