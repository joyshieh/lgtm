// QUnit.module('ValidatorBuilder', {
//   setup: function() {
//     this.builder = LGTM.validator();

//     this.validator = this.builder.validates('invoiceName')
//       .required('invalid invoiceName')
//     .validates('lineItems')
//       .each('name')
//         .required('invalide lineItem name')
//     .build();
//   }
// });

// test('constructs validations correctly for a collection', function() {
//   expect(3);

//   deepEqual(Object.keys(this.validator._validations), [ "invoiceName", "lineItems" ]);
//   equal(this.validator._validations['invoiceName'].length, 1)
//   equal(this.validator._validations['lineItems']['name'].length, 1)
// });

// test('_validateAttribute', function() {
//   obj = {
//     invoiceName: '',
//     lineItems: [ { name: 'Joy' } , { name: '' } ]
//   };
//   debugger;
//   this.validator._validateAttribute(obj, 'invoiceName')
//   // .then(function(results) {
//   //   debugger;
//   //   // results: [[name, msg], [name, msg]]
//   // });
//   // deepEqual(this.validator._validateAttribute(obj, 'lineItems', 'name'), []);
// });
