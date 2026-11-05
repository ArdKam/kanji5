import assert from 'node:assert/strict';
import { createEmptyCard, fsrs, Rating, State } from '../vendor/ts-fsrs-5.4.1.mjs';

const DAY=24*60*60*1000;
const start=new Date('2026-01-01T09:00:00.000Z');

function scheduler({retention=.90,learningSteps=['1m','10m'],relearningSteps=['10m'],fuzz=false}={}){
  return fsrs({
    request_retention:retention,
    maximum_interval:36500,
    enable_fuzz:fuzz,
    enable_short_term:true,
    learning_steps:learningSteps,
    relearning_steps:relearningSteps
  });
}

function applyAtDue(engine,card,grade){
  const reviewed=new Date(card.due);
  const result=engine.next(card,reviewed,Rating[grade]);
  const next=result.card;
  return {
    card:next,
    row:{
      grade,
      fromState:card.state,
      state:next.state,
      learningSteps:next.learning_steps,
      scheduledDays:next.scheduled_days,
      dueMinutes:Math.round((new Date(next.due).getTime()-reviewed.getTime())/60000),
      stability:next.stability
    }
  };
}

function runGoodSequence(config,count=6){
  const engine=scheduler(config);
  let card=createEmptyCard(start),rows=[];
  for(let index=0;index<count;index++){
    const result=applyAtDue(engine,card,'Good');
    card=result.card;
    rows.push(result.row);
  }
  return {card,rows};
}

const current=runGoodSequence({learningSteps:['1m','10m']},6);
const reinforced=runGoodSequence({learningSteps:['1m','10m','23h']},6);
console.log('FSRS-6 current .90 Good sequence:',JSON.stringify(current.rows));
console.log('FSRS-6 candidate .90 + 23h initial reinforcement:',JSON.stringify(reinforced.rows));

// Current policy graduates after the configured 1m and 10m steps.
// The candidate requires an additional long-delay retrieval before graduation.
assert.equal(current.rows[0].state,State.Learning);
assert.equal(current.rows[0].dueMinutes,10);
assert.equal(current.rows[1].state,State.Review);
assert.equal(reinforced.rows[0].state,State.Learning);
assert.equal(reinforced.rows[0].dueMinutes,10);
assert.equal(reinforced.rows[1].state,State.Learning);
assert.equal(reinforced.rows[1].dueMinutes,23*60);
assert.equal(reinforced.rows[2].state,State.Review);
assert.ok(reinforced.rows[2].scheduledDays>=1);

// Desired retention affects FSRS intervals, not the application queue or a second scheduler.
const matureCard=reinforced.card;
const at90=scheduler({retention:.90,learningSteps:['1m','10m','23h']});
const at95=scheduler({retention:.95,learningSteps:['1m','10m','23h']});
const reviewAt=new Date(matureCard.due);
const next90=at90.next(matureCard,reviewAt,Rating.Good).card;
const next95=at95.next(matureCard,reviewAt,Rating.Good).card;
console.log('FSRS-6 retention comparison:',JSON.stringify({
  retention90:{days:next90.scheduled_days,stability:next90.stability},
  retention95:{days:next95.scheduled_days,stability:next95.stability}
}));
assert.ok(next95.scheduled_days<=next90.scheduled_days,'Higher requested retention must not lengthen the same mature review interval');

// Ratings remain differentiated on the same mature FSRS state.
const ratingResults={};
for(const grade of ['Again','Hard','Good','Easy']){
  const engine=scheduler({learningSteps:['1m','10m','23h']});
  const rated=engine.next(matureCard,new Date(matureCard.due),Rating[grade]).card;
  ratingResults[grade]={state:rated.state,days:rated.scheduled_days,lapses:rated.lapses};
}
console.log('FSRS-6 mature rating outcomes:',JSON.stringify(ratingResults));
assert.equal(ratingResults.Again.state,State.Relearning);
assert.ok(ratingResults.Hard.days<ratingResults.Good.days);
assert.ok(ratingResults.Good.days<ratingResults.Easy.days);
assert.equal(ratingResults.Again.lapses,matureCard.lapses+1);

console.log('Kanji 5 deterministic FSRS early-reinforcement policy simulation passed.');
