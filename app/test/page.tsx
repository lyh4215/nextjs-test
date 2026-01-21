export default function App() {


    return (
        <table>
            <thead>
                <tr>
                    <th colSpan={2} rowSpan={3}>Root</th>
                    
                </tr>
                <tr>
                    <th colSpan={2} rowSpan={1}>col1</th>
                    <th colSpan={2} rowSpan={1}>col2</th>
                </tr>
                <tr>
                    <th>col-1</th>
                    <th>col-2</th>
                    <th>col-3</th>
                    <th>col-4</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <th>row-2</th>
                    <th rowSpan={3}>row-1</th>
                    <td>b1</td>
                    <td>b1</td>
                    <td>b1</td>
                    <td>b1</td>
                </tr>
                <tr>
                    <th>row-2</th>
                    <td>b1</td>
                    <td>b1</td>
                    <td>b1</td>
                    <td>b1</td>
                </tr>

            </tbody>
        </table>
    )
}