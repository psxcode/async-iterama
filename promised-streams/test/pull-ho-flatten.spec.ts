import { describe, it } from 'mocha'
import { expect } from 'chai'
import debug from 'debug'
import fn from 'test-fn'
import { waitTimePromise as wait } from '@psxcode/wait'
import { pullConsumer, pullProducer } from 'promised-streams-test/src'
import { pullHoFlatten, pullMap } from '../src'
import { makeNumbers } from './make-numbers'

const producerLog = debug('ai:producer')
const hoproducerLog = debug('ai:hoproducer')
const consumerLog = debug('ai:consumer')
const mapLog = debug('ai:map')
const sinkLog = debug('ai:sink')
const mult2 = (value: number) => {
  mapLog('mapping value')

  return pullProducer({ log: hoproducerLog })([value, value])
}

const amult2 = async (value: number) => {
  mapLog('mapping value begin')
  await wait(50)
  mapLog('mapping value done')

  return pullProducer({ log: hoproducerLog })([value, value])
}

const emult2 = () => {
  throw new Error('error in mapper')
}


describe('[ pullHoFlatten ]', () => {
  it('should work', async () => {
    const data = makeNumbers(4)
    const spy = fn(sinkLog)
    const w = pullConsumer({ log: consumerLog })(spy)
    const t0 = pullMap(mult2)
    const t1 = pullHoFlatten
    const r = pullProducer({ log: producerLog })(data)

    await w(t1(t0(r)))

    expect(spy.calls).deep.eq([
      [{ value: 0, done: false }],
      [{ value: 0, done: false }],
      [{ value: 1, done: false }],
      [{ value: 1, done: false }],
      [{ value: 2, done: false }],
      [{ value: 2, done: false }],
      [{ value: 3, done: false }],
      [{ value: 3, done: false }],
      [{ value: undefined, done: true }],
    ])
  })

  it('should work with async map', async () => {
    const data = makeNumbers(4)
    const spy = fn(sinkLog)
    const w = pullConsumer({ log: consumerLog })(spy)
    const t0 = pullMap(amult2)
    const t1 = pullHoFlatten
    const r = pullProducer({ log: producerLog })(data)

    await w(t1(t0(r)))

    expect(spy.calls).deep.eq([
      [{ value: 0, done: false }],
      [{ value: 0, done: false }],
      [{ value: 1, done: false }],
      [{ value: 1, done: false }],
      [{ value: 2, done: false }],
      [{ value: 2, done: false }],
      [{ value: 3, done: false }],
      [{ value: 3, done: false }],
      [{ value: undefined, done: true }],
    ])
  })

  it('should deliver mapper error to consumer', async () => {
    const data = makeNumbers(4)
    const spy = fn(sinkLog)
    const w = pullConsumer({ log: consumerLog })(spy)
    const t0 = pullMap(emult2)
    const t1 = pullHoFlatten
    const r = pullProducer({ log: producerLog, errorAtStep: 2 })(data)

    try {
      await w(t1(t0(r)))

      expect.fail('should not get here')
    } catch {
      expect(spy.calls).deep.eq([])
    }
  })

  it('should deliver producer error to consumer', async () => {
    const data = makeNumbers(4)
    const spy = fn(sinkLog)
    const w = pullConsumer({ log: consumerLog })(spy)
    const t0 = pullMap(mult2)
    const t1 = pullHoFlatten
    const r = pullProducer({ log: producerLog, errorAtStep: 2 })(data)

    try {
      await w(t1(t0(r)))

      expect.fail('should not get here')
    } catch {
      expect(spy.calls).deep.eq([
        [{ value: 0, done: false }],
        [{ value: 0, done: false }],
        [{ value: 1, done: false }],
        [{ value: 1, done: false }],
      ])
    }
  })

  it('should deliver producer error to consumer and continue', async () => {
    const data = makeNumbers(4)
    const spy = fn(sinkLog)
    const w = pullConsumer({ log: consumerLog, continueOnError: true })(spy)
    const t0 = pullMap(mult2)
    const t1 = pullHoFlatten
    const r = pullProducer({ log: producerLog, errorAtStep: 2 })(data)

    await w(t1(t0(r)))

    expect(spy.calls).deep.eq([
      [{ value: 0, done: false }],
      [{ value: 0, done: false }],
      [{ value: 1, done: false }],
      [{ value: 1, done: false }],
      [{ value: 3, done: false }],
      [{ value: 3, done: false }],
      [{ value: undefined, done: true }],
    ])
  })

  it('should handle producer crash', async () => {
    const data = makeNumbers(4)
    const spy = fn(sinkLog)
    const w = pullConsumer({ log: consumerLog })(spy)
    const t0 = pullMap(mult2)
    const t1 = pullHoFlatten
    const r = pullProducer({ log: producerLog, crashAtStep: 2 })(data)

    try {
      await w(t1(t0(r)))

      expect.fail('should not get here')
    } catch {
      expect(spy.calls).deep.eq([
        [{ value: 0, done: false }],
        [{ value: 0, done: false }],
        [{ value: 1, done: false }],
        [{ value: 1, done: false }],
      ])
    }
  })
})
