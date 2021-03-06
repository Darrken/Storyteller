require 'json'

APIKEY = ENV['api_key'].nil? ? '' : ENV['api_key']

COMPILE_TARGET = ENV['config'].nil? ? "debug" : ENV['config']
RESULTS_DIR = "results"
BUILD_VERSION = '4.1.0'

tc_build_number = ENV["BUILD_NUMBER"]
build_revision = tc_build_number || Time.new.strftime('5%H%M')
build_number = "#{BUILD_VERSION}.#{build_revision}"
BUILD_NUMBER = build_number 

task :ci => [:default, :specifications, :pack, :push]

task :default => [:jstests, :test]


desc "Prepares the working directory for a new build"
task :clean do
	#TODO: do any other tasks required to clean/prepare the working directory
	FileUtils.rm_rf RESULTS_DIR
	FileUtils.rm_rf 'artifacts'

end

desc "Installs npm packages and builds the bundles"
task :npm do
	sh "npm install"
	sh "npm run build-client"
end

desc "Runs Javascript Tests"
task :jstests => [:npm] do
	sh "npm run test"
end

desc "Update the version information for the build"
task :version do
  asm_version = build_number
  
  begin
    commit = `git log -1 --pretty=format:%H`
  rescue
    commit = "git unavailable"
  end
  puts "##teamcity[buildNumber '#{build_number}']" unless tc_build_number.nil?
  puts "Version: #{build_number}" if tc_build_number.nil?
  
  options = {
	:description => 'IoC Container for .Net',
	:product_name => 'Executable Specifications for .Net',
	:copyright => 'Copyright 2008-2017 Jeremy D. Miller, Brandon Behrens, Andrew Kharlamov, et al. All rights reserved.',
	:trademark => commit,
	:version => asm_version,
	:file_version => build_number,
	:informational_version => asm_version
	
  }
  
  puts "Writing src/CommonAssemblyInfo.cs..."
	File.open('src/CommonAssemblyInfo.cs', 'w') do |file|
		file.write "using System.Reflection;\n"
		file.write "using System.Runtime.InteropServices;\n"
		file.write "[assembly: AssemblyDescription(\"#{options[:description]}\")]\n"
		file.write "[assembly: AssemblyProduct(\"#{options[:product_name]}\")]\n"
		file.write "[assembly: AssemblyCopyright(\"#{options[:copyright]}\")]\n"
		file.write "[assembly: AssemblyTrademark(\"#{options[:trademark]}\")]\n"
		file.write "[assembly: AssemblyVersion(\"#{options[:version]}\")]\n"
		file.write "[assembly: AssemblyFileVersion(\"#{options[:file_version]}\")]\n"
		file.write "[assembly: AssemblyInformationalVersion(\"#{options[:informational_version]}\")]\n"
	end
	

end

desc 'Compile the code'
task :compile => [:clean, :npm, :version] do
	sh "dotnet restore src"
end

desc 'Run the unit tests'
task :test => [:compile] do
	Dir.mkdir RESULTS_DIR

	sh "dotnet test src/Storyteller.Testing"
	sh "dotnet test src/StorytellerDocGen.Testing"
    #sh "dotnet test src/IntegrationTests --framework net46"
	#sh "dotnet test src/IntegrationTests --framework netcoreapp1.0"

    sh "dotnet run --project src/StorytellerRunner --framework netcoreapp1.0 -- run src/Specifications --validate"
	
end

desc 'Only runs .Net related tests'
task :dotnet do
	sh "dotnet test src/Storyteller.Testing --framework netcoreapp1.0"
	sh "dotnet test src/StorytellerDocGen.Testing"
end



desc 'Build Nuspec packages'
task :pack do
	sh "dotnet pack src/Storyteller -o artifacts --configuration Release --version-suffix #{build_revision}"
	sh "dotnet pack src/Storyteller.AspNetCore -o artifacts --configuration Release --version-suffix #{build_revision}"
	sh "dotnet pack src/Storyteller.RDBMS -o artifacts --configuration Release --version-suffix #{build_revision}"
	sh "dotnet pack src/StorytellerRunner -o artifacts --configuration Release --version-suffix #{build_revision}"
	sh "dotnet pack src/dotnet-storyteller -o artifacts --configuration Release --version-suffix #{build_revision}"
	sh "dotnet pack src/dotnet-stdocs -o artifacts --configuration Release --version-suffix #{build_revision}"
	
	sh "dotnet publish src/StorytellerRunner --framework NET46 -o artifacts/StorytellerRunner -c Release --version-suffix #{build_revision}"
	sh "nuget.exe pack StorytellerRunnerCsproj.nuspec -o artifacts -version #{build_number}"
	


end

desc "Pushes the Nuget's to MyGet"
task :push do
	#sh "nuget.exe push artifacts/*.nupkg -ApiKey #{APIKEY} -NonInteractive -Source https://www.myget.org/F/storyteller/ "
end

desc "Launches VS to the StructureMap solution file"
task :sln do
	sh "start src/Storyteller.sln"
end

"Gets the documentation assets ready"
task :prepare_docs => [:compile] do
	cp 'src/StorytellerRunner/embed.js', 'documentation/content'
	cp 'client/public/stylesheets/storyteller.css', 'documentation/content/stylesheets'

	sh "dotnet run --project src/StorytellerRunner --framework netcoreapp1.0 -- run src/Samples --dump documentation/content/samples.specs.json"

	sh 'dotnet run --project src/StorytellerRunner -- dump-usages "dotnet storyteller" "documentation/content/dotnet storyteller.usage.xml"'
	sh 'dotnet run --project src/dotnet-stdocs -- dump-usages "dotnet stdocs" "documentation/content/dotnet stdocs.usage.xml"'
end

"Launches the documentation project in editable mode"
task :docs => [:prepare_docs] do
	sh "dotnet run --project src/dotnet-stdocs -- run -v #{BUILD_VERSION}"
end

"Exports the documentation to storyteller.github.io - requires Git access to that repo though!"
task :publish => [:prepare_docs] do
	if Dir.exists? 'doc-target' 
		FileUtils.rm_rf 'doc-target'
	end

	sh "dotnet restore"

	Dir.mkdir 'doc-target'
	sh "git clone https://github.com/storyteller/storyteller.github.io.git doc-target"
	
	
	sh "dotnet run --project src/dotnet-stdocs -- export doc-target Website --version #{BUILD_VERSION}"
	
	Dir.chdir "doc-target" do
		sh "git add --all"
		sh "git commit -a -m \"Documentation Update for #{BUILD_VERSION}\" --allow-empty"
		sh "git push origin master"
	end
	

	

end

"Run the spec editor w/ samples"
task :samples do
	sh "dotnet run --project src/StorytellerRunner --framework netcoreapp1.0 open src/Storyteller.Samples"
end

"Run the spec editor w/ samples"
task :testbed do
	sh "dotnet run --project src/StorytellerRunner --framework netcoreapp1.0 open src/Testbed"
end

"Run the spec editor w/ the documentation samples"
task :docsamples do
	sh "dotnet run --project src/StorytellerRunner --framework netcoreapp1.0 open src/Samples"
end


"Run the spec editor for Storyteller.Samples with hot reloading"
task :harness do
	sh "dotnet run --project src/StorytellerRunner --framework netcoreapp1.0 open src/Storyteller.Samples --hotreload"
end

"Run the specs against the documentation generation"
task :specifications do
	sh "dotnet run --project src/StorytellerRunner --framework netcoreapp1.0 run src/Specifications"
end

"Run the database sample specs"
task :dbsamples do
	sh "dotnet run --project src/StorytellerRunner --framework netcoreapp1.0 open src/DatabaseSamples"
end

def load_project_file(project)
  File.open(project) do |file|
    file_contents = File.read(file, :encoding => 'bom|utf-8')
    JSON.parse(file_contents)
  end
end
