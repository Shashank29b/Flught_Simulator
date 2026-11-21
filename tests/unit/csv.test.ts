import { describe, expect, it } from 'vitest'
import { parseCsv } from '../../prisma/csv'

describe('parseCsv', () => {
  it('parses quoted fields, commas and escaped quotes', () => {
    const r = parseCsv('"id","name","x"\n1,"Kempegowda, Bengaluru","say ""hi"""\r\n2,plain,\n')
    expect(r).toEqual([{ id: '1', name: 'Kempegowda, Bengaluru', x: 'say "hi"' }, { id: '2', name: 'plain', x: '' }])
  })
})
