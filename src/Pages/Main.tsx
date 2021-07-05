import * as React from 'react'

const Main = () => {    
    //defining variables
    const [count, setCount] = React.useState(0) //count is an immutable variable, setCount is a function that updates count, the 0 says that count starts with initial value 0

    const handleClick = () => {
        setCount(count + 1) // increment count by 1 when button is clicked
    }

    return (
        // <h1>Hello</h1>
        // React.Fragment returns its children (used cause react components can only return one root component while we have 2)
        <React.Fragment>
            <h1>Counter: {count}</h1> {//count is automatically updated when it changes
            }
            <button onClick={handleClick}>Increment Count</button> {//button to increment count
            }
        </React.Fragment>
    )
}

export default Main