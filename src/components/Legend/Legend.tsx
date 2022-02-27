import React from 'react'
import {Flight} from '../../flights'
import './Legend.css'

type Props = {
  flight: Flight
}

function Legend({flight}: Props): React.ReactElement {
  return (
    <div className="Legend">
      <section>
        <span className="label">Date</span>
        <span className="value">{flight.date.toLocaleDateString()}</span>
      </section>
      <section>
        <span className="label">Flight</span>
        <span className="value">{flight.flight}</span>
      </section>
      <section>
        <span className="label">Route</span>
        <span className="value">
          {flight.from.code} ➝ {flight.to.code}
        </span>
      </section>
    </div>
  )
}

export default Legend
