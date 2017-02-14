<!--Title:Topic Outlines-->
<!--Url:outlines-->

If you want to quickly generate the skeleton of a documentation project, Storyteller comes with the `dotnet stdocs seed` (`st doc-seed` in Storyteller 3.*) command. 

The first step is to write a file called `outline.txt` in your `/documentation` folder. Configure the topics in the order and structure you want with the right titles with a format like this (originally used to generate the documentation you are reading):

<pre>
index:Storyteller for Executable Specifications and Living Documentation
terminology
system_under_test:Connecting Storyteller to the System under Test
language:Crafting the Specification Language
table_vs_flow:Table vs. Flow Based Testing
fixtures
fixtures/context:Using the Specification Context
fixtures/state:State Management across Fixtures
grammars
grammars/actions:Carrying out Actions
grammars/facts:Asserting Facts
grammars/assertions:Asserting Values
grammars/paragraphs:'Macros' with Paragraph Grammars
grammars/tables:Tables
grammars/decision_tables:Decision Tables
grammars/sets:Verifying a Set of Data
grammars/embedded_section:Embedded Sections
grammars/reusing:Reusing Grammars across Fixtures
grammars/currying:Currying Grammars for more Expressive Specifications
comments:Embedding Comments in Specifications
selection_lists:Selection Lists
system_state:Setting up System State
conversion:Data Conversion within Specifications
ui:The User Interface
ui/spec-explorer:The Specification Explorer
ui/spec-editor:The Specification Editor
performance:Performance Timing
instrumentation:Instrumenting Specification Execution
ci:Integration with Continuous Integration
docs:Living Documentation Generation
docs/navigation:Creating a Navigation Structure
docs/outlines:Topic Outlines
docs/topics:Topic Files
docs/samples:Embedding Code Samples
docs/theme:Documentation Theme
docs/running:Running the Documentation Website Locally
docs/export:Exporting the Documentation
</pre>


Once you are happy with the order, run `st doc-seed` to create a shell of the topic files.

Right now this is a one way generation, but if there is demand (or better yet a pull request;-)), this could be extended to be bi-directional.


<[command-usage:dotnet stdocs/seed]>

<[/command-usage:dotnet stdocs/seed]>


