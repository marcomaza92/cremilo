## Summary Boxes

- There should be a box with the total incomes, total outcomes and the net balance in the

## Main Content

- Create a table for each section (Ingresos, Gastos Fijos, Tarjetas) that can be collapsible
- Add a add/edit form for each item for each section, where you can fill in the item's name, currency, is payed? and payment method.
  - When currency is set to USD, show "Real value" and "Rate". Rate should be prefilled with the info from a global configuration screen and freezed AFTER the due date is past
  - When currency is set to ARS, show only "Real value"
- On each table show Item, Value, is Payed?, Payment Method, action buttons inside a kebab

## Configuration Screen

- It should have a section called Rates, with USD, Dolar Tarjeta, EUR and YEN rates. Those will applied globally. You can also add custom rates (name and rates)
- It should have a section called Format for date and value number. Each one should be a dropdown with 5 of the most common options
- In an advanced zone section, it should have an option called "Global Currency". Default is ARS and options are ARS, USD and EUR.
  - When USD or EUR are selected, a new field should appear to be filled with the global rate value
  - This change will affect the add/edit form of Items in the Main Content. Now, the global currency should be the one by default in the currency field, and changing it, will show the global currency rate that can be updated manually for each item
