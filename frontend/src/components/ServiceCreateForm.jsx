import { useState } from "react";

const initialValues = {
  name: "",
  url: "",
  expectedStatusCode: "200",
  intervalSeconds: "60",
  timeoutSeconds: "5",
  failureThreshold: "3",
};

function ServiceCreateForm({ onCreate, isSubmitting }) {
  const [values, setValues] = useState(initialValues);

  function handleChange(event) {
    setValues({
      ...values,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const wasCreated = await onCreate({
      name: values.name,
      url: values.url,
      expectedStatusCode: Number(values.expectedStatusCode),
      intervalSeconds: Number(values.intervalSeconds),
      timeoutSeconds: Number(values.timeoutSeconds),
      failureThreshold: Number(values.failureThreshold),
    });

    if (wasCreated) {
      setValues(initialValues);
    }
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Add service</h2>
        <span>HTTP monitor</span>
      </div>

      <form className="service-form" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Name</span>
          <input
            name="name"
            placeholder="Example API"
            required
            type="text"
            value={values.name}
            onChange={handleChange}
          />
        </label>

        <label className="form-field url-field">
          <span>URL</span>
          <input
            name="url"
            placeholder="https://example.com/health"
            required
            type="url"
            value={values.url}
            onChange={handleChange}
          />
        </label>

        <label className="form-field">
          <span>Expected HTTP</span>
          <input
            max="599"
            min="100"
            name="expectedStatusCode"
            required
            type="number"
            value={values.expectedStatusCode}
            onChange={handleChange}
          />
        </label>

        <label className="form-field">
          <span>Interval seconds</span>
          <input
            min="1"
            name="intervalSeconds"
            required
            type="number"
            value={values.intervalSeconds}
            onChange={handleChange}
          />
        </label>

        <label className="form-field">
          <span>Timeout seconds</span>
          <input
            min="1"
            name="timeoutSeconds"
            required
            type="number"
            value={values.timeoutSeconds}
            onChange={handleChange}
          />
        </label>

        <label className="form-field">
          <span>Failure threshold</span>
          <input
            min="1"
            name="failureThreshold"
            required
            type="number"
            value={values.failureThreshold}
            onChange={handleChange}
          />
        </label>

        <div className="form-actions">
          <button
            className="button primary-button"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Creating..." : "Create service"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default ServiceCreateForm;
